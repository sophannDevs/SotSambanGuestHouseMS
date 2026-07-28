package com.guesthouse.security;

import java.time.Instant;
import java.util.UUID;

/**
 * Access tokens are stateless JWTs, valid until their natural expiry with no
 * server-side record — so revoking one before then (logout) needs an
 * explicit denylist. Two revocation modes:
 *
 *  - blacklistToken:    kills one specific access token (single-session logout).
 *  - revokeAllForUser:  kills every access token issued to a user up to now
 *                       (logout-all), without having to track each one.
 */
public interface TokenBlacklistService {

    void blacklistToken(String rawAccessToken, Instant expiresAt);

    boolean isTokenBlacklisted(String rawAccessToken);

    void revokeAllForUser(UUID userId, Instant revokedAt);

    boolean isRevokedForUser(UUID userId, Instant tokenIssuedAt);
}
