package com.sorteiofsw.controller;

import com.sorteiofsw.domain.LoginRequest;
import com.sorteiofsw.domain.LoginResponse;
import com.sorteiofsw.domain.UserResponse;
import com.sorteiofsw.security.JwtAuthenticationFilter;
import com.sorteiofsw.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    @Value("${auth.cookie.secure:false}")
    private boolean cookieSecure;
    @Value("${auth.cookie.same-site:Strict}")
    private String cookieSameSite;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        var response = service.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookie(response.token(), response.expiresIn()).toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, authCookie("", 0).toString())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.me(user));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Void> handleAuthenticationException() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    private ResponseCookie authCookie(String token, long maxAge) {
        return ResponseCookie.from(JwtAuthenticationFilter.AUTH_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
