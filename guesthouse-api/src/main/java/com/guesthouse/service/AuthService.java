package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.auth.*;
import com.guesthouse.entity.LoginHistory;
import com.guesthouse.entity.Permission;
import com.guesthouse.entity.RefreshToken;
import com.guesthouse.entity.Role;
import com.guesthouse.entity.User;
import com.guesthouse.repository.LoginHistoryRepository;
import com.guesthouse.repository.RefreshTokenRepository;
import com.guesthouse.repository.UserRepository;
import com.guesthouse.security.JwtTokenProvider;
import com.guesthouse.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            LoginHistoryRepository loginHistoryRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.loginHistoryRepository = loginHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        Optional<User> userOpt = userRepository.findByEmailAndDeletedAtIsNull(request.getEmail());

        if (userOpt.isEmpty()) {
            recordLoginAttempt(null, request.getEmail(), "LOGIN_FAILED", "FAILED", "Invalid credentials", ip, userAgent);
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        User user = userOpt.get();

        if ("LOCKED".equalsIgnoreCase(user.getStatus()) || (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now()))) {
            recordLoginAttempt(user.getId(), request.getEmail(), "LOGIN_FAILED", "FAILED", "Account locked", ip, userAgent);
            throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= 5) {
                user.setStatus("LOCKED");
                user.setLockedUntil(Instant.now().plusSeconds(1800)); // lock 30 mins
            }
            userRepository.save(user);

            recordLoginAttempt(user.getId(), request.getEmail(), "LOGIN_FAILED", "FAILED", "Invalid password", ip, userAgent);
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        // Reset failed login count
        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(Instant.now());
        user.setLastLoginIp(ip);
        userRepository.save(user);

        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = tokenProvider.generateAccessToken(principal);

        // Generate Refresh Token
        String rawRefreshToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(tokenHash);
        refreshToken.setFamilyId(UUID.randomUUID());
        refreshToken.setIpAddress(ip);
        refreshToken.setDeviceInfo(userAgent != null && userAgent.length() > 250 ? userAgent.substring(0, 250) : userAgent);
        refreshToken.setExpiresAt(Instant.now().plusMillis(tokenProvider.getRefreshExpirationMs()));
        refreshTokenRepository.save(refreshToken);

        recordLoginAttempt(user.getId(), request.getEmail(), "LOGIN", "SUCCESS", null, ip, userAgent);

        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        Set<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getPermissionKey)
                .collect(Collectors.toSet());

        return new LoginResponse(
                accessToken,
                rawRefreshToken,
                "Bearer",
                user.getId(),
                user.getPropertyId(),
                user.getEmail(),
                user.getDisplayName(),
                roles,
                permissions
        );
    }

    @Transactional
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String tokenHash = hashToken(request.getRefreshToken());
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        RefreshToken oldToken = tokenOpt.get();

        // Replay detection: if token is already revoked, revoke whole family
        if (oldToken.getRevokedAt() != null) {
            refreshTokenRepository.revokeFamily(oldToken.getFamilyId(), Instant.now());
            throw new BusinessException(ErrorCode.TOKEN_INVALID, "Replayed token detected. Session revoked.");
        }

        if (oldToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        }

        User user = oldToken.getUser();
        if (user.getDeletedAt() != null || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        // Revoke old token & rotate
        oldToken.setRevokedAt(Instant.now());

        String newRawRefreshToken = UUID.randomUUID().toString();
        String newTokenHash = hashToken(newRawRefreshToken);

        RefreshToken newToken = new RefreshToken();
        newToken.setUser(user);
        newToken.setTokenHash(newTokenHash);
        newToken.setFamilyId(oldToken.getFamilyId());
        newToken.setIpAddress(oldToken.getIpAddress());
        newToken.setDeviceInfo(oldToken.getDeviceInfo());
        newToken.setExpiresAt(Instant.now().plusMillis(tokenProvider.getRefreshExpirationMs()));
        refreshTokenRepository.save(newToken);

        oldToken.setReplacedByTokenId(newToken.getId());
        refreshTokenRepository.save(oldToken);

        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = tokenProvider.generateAccessToken(principal);

        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        Set<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getPermissionKey)
                .collect(Collectors.toSet());

        return new LoginResponse(
                accessToken,
                newRawRefreshToken,
                "Bearer",
                user.getId(),
                user.getPropertyId(),
                user.getEmail(),
                user.getDisplayName(),
                roles,
                permissions
        );
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = hashToken(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(t -> {
                t.setRevokedAt(Instant.now());
                refreshTokenRepository.save(t);
            });
        }
    }

    @Transactional
    public void logoutAll(UUID userId) {
        refreshTokenRepository.revokeAllForUser(userId, Instant.now());
    }

    private void recordLoginAttempt(UUID userId, String email, String action, String status, String reason, String ip, String userAgent) {
        LoginHistory history = new LoginHistory();
        history.setUserId(userId);
        history.setAttemptedEmail(email);
        history.setAction(action);
        history.setStatus(status);
        history.setFailureReason(reason);
        history.setIpAddress(ip);
        history.setUserAgent(userAgent != null && userAgent.length() > 450 ? userAgent.substring(0, 450) : userAgent);
        loginHistoryRepository.save(history);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
