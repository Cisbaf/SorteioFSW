package com.sorteiofsw.domain;

public record LoginResponse(
        String token,
        long expiresIn
) {
}
