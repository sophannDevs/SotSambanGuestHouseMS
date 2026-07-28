package com.guesthouse.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Startup validator that checks for insecure default environment variables when running in production profile.
 */
@Component
public class EnvSecretValidator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EnvSecretValidator.class);

    private static final String DEFAULT_JWT_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final String DEFAULT_DB_PASSWORD = "postgres_password_change_me";

    private final Environment environment;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    public EnvSecretValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");

        if (isProd) {
            log.info("🔒 Security Guardrail: Running production profile validation check...");

            if (DEFAULT_JWT_SECRET.equals(jwtSecret)) {
                log.warn("⚠️ SECURITY WARNING: Application is running in PROD profile with DEFAULT JWT_SECRET!");
                log.warn("👉 Please set a unique JWT_SECRET environment variable in production!");
            }

            if (DEFAULT_DB_PASSWORD.equals(dbPassword)) {
                log.warn("⚠️ SECURITY WARNING: Application is running in PROD profile with DEFAULT Database Password!");
                log.warn("👉 Please change POSTGRES_PASSWORD in your production environment file!");
            }

            if (!DEFAULT_JWT_SECRET.equals(jwtSecret) && !DEFAULT_DB_PASSWORD.equals(dbPassword)) {
                log.info("✅ Security Guardrail: Production secret configuration passed.");
            }
        }
    }
}
