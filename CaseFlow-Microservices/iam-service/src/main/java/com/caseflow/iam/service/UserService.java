package com.caseflow.iam.service;

import com.caseflow.iam.dto.*;
import com.caseflow.iam.entity.User;
import com.caseflow.iam.exception.*;
import com.caseflow.iam.repository.UserRepository;
import com.caseflow.iam.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service @RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final AuditLogService auditLogService;

    public UserResponse registerLitigant(UserRequest request) {
        request.setRole(User.Role.LITIGANT);
        return register(request);
    }

    public UserResponse createUserByAdmin(UserRequest request) { return register(request); }

    private UserResponse register(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        User user = User.builder().name(request.getName()).role(request.getRole())
            .email(request.getEmail()).phone(request.getPhone())
            .password(passwordEncoder.encode(request.getPassword()))
            .status(User.Status.ACTIVE).build();
        User saved = userRepository.save(user);
        auditLogService.log(saved.getUserId(), "USER_REGISTERED", "User:" + saved.getUserId());
        return mapToResponse(saved);
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getStatus() == User.Status.INACTIVE)
            throw new InvalidOperationException("User account is inactive");
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        auditLogService.log(user.getUserId(), "USER_LOGIN", "User:" + user.getUserId());
        return new LoginResponse(token, user.getRole().name(), user.getName());
    }

    public String changePassword(ChangePasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword()))
            throw new BadRequestException("Old password is incorrect");
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return "Password changed successfully";
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    public UserResponse getUserById(Long id) {
        return mapToResponse(userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id)));
    }

    public UserResponse updateStatus(Long id, User.Status status) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setStatus(status);
        return mapToResponse(userRepository.save(user));
    }

    public boolean existsById(Long id) { return userRepository.existsById(id); }

    public String getUserRole(Long id) {
        return userRepository.findById(id)
            .map(u -> u.getRole().name())
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public String deleteUser(Long userId) {
        userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        userRepository.deleteById(userId);
        return "User deleted successfully";
    }

    private UserResponse mapToResponse(User user) {
        UserResponse res = new UserResponse();
        res.setUserId(user.getUserId()); res.setName(user.getName());
        res.setRole(user.getRole()); res.setEmail(user.getEmail());
        res.setPhone(user.getPhone()); res.setStatus(user.getStatus());
        return res;
    }
}
