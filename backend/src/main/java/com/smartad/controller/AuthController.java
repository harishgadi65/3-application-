package com.smartad.controller;

import com.smartad.dto.request.GuestJoinRequest;
import com.smartad.dto.request.LoginRequest;
import com.smartad.dto.request.RegisterRequest;
import com.smartad.dto.response.ApiResponse;
import com.smartad.dto.response.AuthResponse;
import com.smartad.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/guest")
    public ResponseEntity<ApiResponse<AuthResponse>> guestJoin(@Valid @RequestBody GuestJoinRequest request) {
        AuthResponse response = authService.guestJoin(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<AuthResponse>> adminLogin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.adminLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Admin login successful", response));
    }
}
