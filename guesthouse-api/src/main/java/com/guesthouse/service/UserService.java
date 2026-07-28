package com.guesthouse.service;

import com.guesthouse.common.exception.BusinessException;
import com.guesthouse.common.exception.ErrorCode;
import com.guesthouse.dto.auth.ChangePasswordRequest;
import com.guesthouse.dto.user.LoginHistoryResponse;
import com.guesthouse.dto.user.UpdateProfileRequest;
import com.guesthouse.dto.user.UserProfileResponse;
import com.guesthouse.entity.Permission;
import com.guesthouse.entity.Role;
import com.guesthouse.entity.User;
import com.guesthouse.repository.LoginHistoryRepository;
import com.guesthouse.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, LoginHistoryRepository loginHistoryRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.loginHistoryRepository = loginHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        if (request.getDisplayName() != null) user.setDisplayName(request.getDisplayName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getPreferredLanguage() != null) user.setPreferredLanguage(request.getPreferredLanguage());
        if (request.getTheme() != null) user.setTheme(request.getTheme());

        User saved = userRepository.save(user);
        return mapToProfileResponse(saved);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Page<LoginHistoryResponse> getLoginHistory(UUID userId, Pageable pageable) {
        return loginHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(lh -> new LoginHistoryResponse(
                        lh.getId(),
                        lh.getUserId(),
                        lh.getAttemptedEmail(),
                        lh.getAction(),
                        lh.getStatus(),
                        lh.getFailureReason(),
                        lh.getIpAddress(),
                        lh.getUserAgent(),
                        lh.getCreatedAt()
                ));
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        Set<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getPermissionKey)
                .collect(Collectors.toSet());

        return new UserProfileResponse(
                user.getId(),
                user.getPropertyId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getPreferredLanguage(),
                user.getTheme(),
                user.getStatus(),
                user.getLastLoginAt(),
                user.getLastLoginIp(),
                roles,
                permissions
        );
    }
}
