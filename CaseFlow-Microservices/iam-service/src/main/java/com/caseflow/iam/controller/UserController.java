package com.caseflow.iam.controller;

import com.caseflow.iam.dto.*;
import com.caseflow.iam.entity.AuditLog;
import com.caseflow.iam.entity.User;
import com.caseflow.iam.service.AuditLogService;
import com.caseflow.iam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/users") @RequiredArgsConstructor
@Tag(name = "User Management", description = "User CRUD and audit logs")
public class UserController {
    private final UserService userService;
    private final AuditLogService auditLogService;

    @PostMapping("/create") @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new user (Admin only)")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.createUserByAdmin(request));
    }

    @GetMapping @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() { return ResponseEntity.ok(userService.getAllUsers()); }

    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','CLERK')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/status") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateStatus(@PathVariable Long id, @RequestParam User.Status status) {
        return ResponseEntity.ok(userService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deleteUser(id));
    }

    @GetMapping("/audit-logs") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> getAllLogs() { return ResponseEntity.ok(auditLogService.getAllLogs()); }

    @GetMapping("/audit-logs/{userId}") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> getLogsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(auditLogService.getLogsByUser(userId));
    }

    // --- Internal endpoints for inter-service communication ---
    @GetMapping("/exists/{id}")
    public ResponseEntity<Boolean> existsById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.existsById(id));
    }

    @GetMapping("/{id}/role")
    public ResponseEntity<String> getUserRole(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserRole(id));
    }
}
