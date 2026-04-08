package com.caseflow.iam.controller;

import com.caseflow.iam.dto.*;
import com.caseflow.iam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, change password")
public class AuthController {
    private final UserService userService;

    @PostMapping("/register") @Operation(summary = "Register as a Litigant")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.registerLitigant(request));
    }

    @PostMapping("/login") @Operation(summary = "Login and get JWT token")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @PutMapping("/change-password") @Operation(summary = "Change password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(userService.changePassword(request));
    }
}
