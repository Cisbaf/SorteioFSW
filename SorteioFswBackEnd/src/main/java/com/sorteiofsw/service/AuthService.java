package com.sorteiofsw.service;

import com.sorteiofsw.domain.LoginRequest;
import com.sorteiofsw.domain.LoginResponse;
import com.sorteiofsw.domain.UserResponse;
import com.sorteiofsw.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        var authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password()));
        return new LoginResponse(jwtService.generate(authentication.getName()), jwtService.getExpirationSeconds());
    }

    public UserResponse me(UserDetails user) {
        return new UserResponse(
                user.getUsername(),
                user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList()
        );
    }
}
