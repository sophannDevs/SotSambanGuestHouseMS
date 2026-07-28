package com.guesthouse.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Shared across every API instance via Redis, so revocation takes effect
 * everywhere immediately instead of only on the instance that handled the
 * logout request. Revocation checks fail OPEN on a Redis error (logged, not
 * thrown): if the cache is unreachable, a still-signature-valid JWT keeps
 * working rather than locking every user out because a side channel is down.
 */
@Component
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
public class RedisTokenBlacklistService implements TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(RedisTokenBlacklistService.class);
    private static final String TOKEN_KEY_PREFIX = "auth:blacklist:token:";
    private static final String USER_REVOKED_BEFORE_PREFIX = "auth:revoked-before:";

    private final StringRedisTemplate redisTemplate;
    private final Duration maxAccessTokenTtl;

    public RedisTokenBlacklistService(
            StringRedisTemplate redisTemplate,
            @Value("${app.security.jwt.access-expiration-minutes:30}") long accessExpirationMinutes
    ) {
        this.redisTemplate = redisTemplate;
        this.maxAccessTokenTtl = Duration.ofMinutes(accessExpirationMinutes);
    }

    @Override
    public void blacklistToken(String rawAccessToken, Instant expiresAt) {
        Duration ttl = Duration.between(Instant.now(), expiresAt);
        if (ttl.isNegative() || ttl.isZero()) {
            return; // already expired, nothing to revoke
        }
        try {
            redisTemplate.opsForValue().set(TOKEN_KEY_PREFIX + TokenHashUtil.sha256Hex(rawAccessToken), "1", ttl);
        } catch (Exception ex) {
            log.warn("Failed to blacklist access token in Redis: {}", ex.getMessage());
        }
    }

    @Override
    public boolean isTokenBlacklisted(String rawAccessToken) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(TOKEN_KEY_PREFIX + TokenHashUtil.sha256Hex(rawAccessToken)));
        } catch (Exception ex) {
            log.warn("Failed to check token blacklist in Redis, failing open: {}", ex.getMessage());
            return false;
        }
    }

    @Override
    public void revokeAllForUser(UUID userId, Instant revokedAt) {
        try {
            redisTemplate.opsForValue().set(
                    USER_REVOKED_BEFORE_PREFIX + userId,
                    String.valueOf(revokedAt.toEpochMilli()),
                    maxAccessTokenTtl
            );
        } catch (Exception ex) {
            log.warn("Failed to record logout-all revocation in Redis: {}", ex.getMessage());
        }
    }

    @Override
    public boolean isRevokedForUser(UUID userId, Instant tokenIssuedAt) {
        try {
            String value = redisTemplate.opsForValue().get(USER_REVOKED_BEFORE_PREFIX + userId);
            if (value == null) {
                return false;
            }
            return tokenIssuedAt.isBefore(Instant.ofEpochMilli(Long.parseLong(value)));
        } catch (Exception ex) {
            log.warn("Failed to check logout-all revocation in Redis, failing open: {}", ex.getMessage());
            return false;
        }
    }
}
