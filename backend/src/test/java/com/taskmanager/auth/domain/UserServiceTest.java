package com.taskmanager.auth.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.taskmanager.shared.error.ApiException;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository users;
    @Mock
    PasswordEncoder passwordEncoder;
    @InjectMocks
    UserService userService;

    @Test
    void create_rejectsDuplicateEmail() {
        when(users.existsByEmailIgnoreCase("ana@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.create("Ana", "ana@example.com", "password1"))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void create_normalizesEmailAndHashesPassword() {
        when(users.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(passwordEncoder.encode("password1")).thenReturn("hashed");
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User created = userService.create("  Ana  ", "  Ana@Example.com ", "password1");

        assertThat(created.getEmail()).isEqualTo("ana@example.com");
        assertThat(created.getName()).isEqualTo("Ana");
        assertThat(created.getPasswordHash()).isEqualTo("hashed");
    }

    @Test
    void matchesPassword_delegatesToEncoder() {
        User user = new User("Ana", "ana@example.com", "hashed");
        when(passwordEncoder.matches("raw", "hashed")).thenReturn(true);

        assertThat(userService.matchesPassword(user, "raw")).isTrue();
    }
}
