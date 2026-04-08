package com.caseflow.iam.service;

import com.caseflow.iam.dto.*;
import com.caseflow.iam.entity.User;
import com.caseflow.iam.exception.*;
import com.caseflow.iam.repository.UserRepository;
import com.caseflow.iam.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private AuditLogService auditLogService;
    @InjectMocks private UserService userService;

    @Test void getUserById_found() {
        User user = User.builder().userId(1L).name("Test").role(User.Role.ADMIN)
            .email("test@test.com").status(User.Status.ACTIVE).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        UserResponse result = userService.getUserById(1L);
        assertEquals("Test", result.getName());
    }

    @Test void getUserById_notFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(99L));
    }

    @Test void register_duplicateEmail_throws() {
        when(userRepository.existsByEmail("dup@test.com")).thenReturn(true);
        UserRequest req = new UserRequest();
        req.setEmail("dup@test.com"); req.setName("Dup"); req.setRole(User.Role.LITIGANT);
        req.setPhone("1234567890"); req.setPassword("pass123");
        assertThrows(DuplicateResourceException.class, () -> userService.registerLitigant(req));
    }

    @Test void existsById_true() {
        when(userRepository.existsById(1L)).thenReturn(true);
        assertTrue(userService.existsById(1L));
    }
}
