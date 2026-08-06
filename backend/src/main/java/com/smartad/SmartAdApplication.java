package com.smartad;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Smart Interactive Advertising & Gaming Platform
 * backend - a Spring Boot application exposing a REST + STOMP-over-websocket
 * API that powers a TV screen (shared game view, leaderboard, ads) and phone
 * controllers (register/login, join session, play) for pluggable
 * multiplayer games (Snake, Tap Blast Race, and any future game dropped in
 * as a new {@code GamePlugin} bean).
 */
@SpringBootApplication
public class SmartAdApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartAdApplication.class, args);
    }
}
