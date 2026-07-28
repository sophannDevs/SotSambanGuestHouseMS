package com.guesthouse.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Single-instance, in-process fallback used when app.redis.enabled=false
 * (the local/test default, so developers don't need Redis running just to
 * exercise logout). Entries are cleared on restart and never shared across
 * instances — fine for local dev, not a substitute for Redis in production.
 */
@Component
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryTokenBlacklistService implements TokenBlacklistService {

    private final Map<String, Instant> blacklistedTokenHashes = new ConcurrentHashMap<>();
    private final Map<UUID, Instant> revokedBeforeByUser = new ConcurrentHashMap<>();

    @Override
    public void blacklistToken(String rawAccessToken, Instant expiresAt) {
        if (expiresAt.isBefore(Instant.now())) {
            return;
        }
        purgeExpired();
        blacklistedTokenHashes.put(TokenHashUtil.sha256Hex(rawAccessToken), expiresAt);
    }

    @Override
    public boolean isTokenBlacklisted(String rawAccessToken) {
        Instant expiresAt = blacklistedTokenHashes.get(TokenHashUtil.sha256Hex(rawAccessToken));
        return expiresAt != null && expiresAt.isAfter(Instant.now());
    }

    @Override
    public void revokeAllForUser(UUID userId, Instant revokedAt) {
        revokedBeforeByUser.put(userId, revokedAt);
    }

    @Override
    public boolean isRevokedForUser(UUID userId, Instant tokenIssuedAt) {
        Instant revokedBefore = revokedBeforeByUser.get(userId);
        return revokedBefore != null && tokenIssuedAt.isBefore(revokedBefore);
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        blacklistedTokenHashes.values().removeIf(expiresAt -> expiresAt.isBefore(now));
    }
}
