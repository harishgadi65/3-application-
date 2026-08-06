package com.smartad.mapper;

import com.smartad.dto.response.AuthResponse;
import com.smartad.entity.Admin;
import com.smartad.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public AuthResponse.UserSummary toUserSummary(User user) {
        if (user == null) {
            return null;
        }
        return AuthResponse.UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .build();
    }

    public AuthResponse.AdminSummary toAdminSummary(Admin admin) {
        if (admin == null) {
            return null;
        }
        return AuthResponse.AdminSummary.builder()
                .id(admin.getId())
                .username(admin.getUsername())
                .email(admin.getEmail())
                .build();
    }
}
