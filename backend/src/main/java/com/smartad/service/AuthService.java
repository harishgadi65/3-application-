package com.smartad.service;

import com.smartad.dto.request.LoginRequest;
import com.smartad.dto.request.RegisterRequest;
import com.smartad.dto.response.AuthResponse;
import com.smartad.entity.Admin;
import com.smartad.entity.User;
import com.smartad.exception.AuthenticationException;
import com.smartad.mapper.UserMapper;
import com.smartad.repository.AdminRepository;
import com.smartad.repository.UserRepository;
import com.smartad.security.JwtTokenProvider;
import com.smartad.util.Constants;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles registration/login for both players (USER role) and admins
 * (ADMIN role), issuing a JWT for each successful flow.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AuthenticationException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthenticationException("Email is already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .build();
        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), Constants.ROLE_USER);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(userMapper.toUserSummary(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid username or password");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), Constants.ROLE_USER);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(userMapper.toUserSummary(user))
                .build();
    }

    public AuthResponse adminLogin(LoginRequest request) {
        Admin admin = adminRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new AuthenticationException("Invalid username or password");
        }

        String token = jwtTokenProvider.generateToken(admin.getId(), admin.getUsername(), Constants.ROLE_ADMIN);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .admin(userMapper.toAdminSummary(admin))
                .build();
    }
}
