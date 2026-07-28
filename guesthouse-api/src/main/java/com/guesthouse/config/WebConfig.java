package com.guesthouse.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

// CORS lives in SecurityConfig's corsConfigurationSource() bean, not here —
// Spring Security's filter chain runs ahead of WebMvcConfigurer's
// handler-mapping-level CORS processing, so a mapping registered on this
// class alone never reached a preflight OPTIONS request for an authenticated
// endpoint (see SecurityConfig's comment for the full story).
@Configuration
public class WebConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
