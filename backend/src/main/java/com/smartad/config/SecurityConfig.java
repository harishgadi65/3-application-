package com.smartad.config;

import com.smartad.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Stateless JWT security chain. Public endpoints allow anonymous access
 * (registration/login, QR image, published game catalog, active ad feed and
 * the websocket handshake); a small set of admin-only management endpoints
 * require {@code ROLE_ADMIN}; everything else simply requires a valid JWT.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sessions/*/qr").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sessions/active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sessions/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sessions/*/players").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sessions/*/leaderboard").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/games/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ads").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/screens/by-code/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/screens/tv-setup").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // Admin-only management
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/ads/all").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/ads/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/ads/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/ads/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/sessions").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/start").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/end").hasAuthority("ROLE_ADMIN")

                        // Player-only actions
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/join").hasAuthority("ROLE_USER")
                        .requestMatchers(HttpMethod.POST, "/api/screens/by-code/*/join").hasAuthority("ROLE_USER")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/select-game").hasAuthority("ROLE_USER")
                        .requestMatchers(HttpMethod.POST, "/api/sessions/*/replay").hasAuthority("ROLE_USER")
                        .requestMatchers(HttpMethod.GET, "/api/players/me/history").hasAuthority("ROLE_USER")

                        // Everything else simply requires a valid JWT (either role)
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
