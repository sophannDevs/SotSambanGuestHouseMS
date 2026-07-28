package com.guesthouse;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class GuestHouseApiApplication {

    private static final Logger log = LoggerFactory.getLogger(GuestHouseApiApplication.class);

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        log.info("Guest House API initialized in UTC timezone");
    }

    public static void main(String[] args) {
        SpringApplication.run(GuestHouseApiApplication.class, args);
    }
}
