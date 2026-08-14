package com.smartad.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /** Mobile number, email, or username - AuthService tries all three.
     * Accepts the legacy "username" key too (admin login still sends that). */
    @NotBlank(message = "Mobile number or email is required")
    @JsonAlias("username")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;
}
