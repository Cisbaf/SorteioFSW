package com.sorteiofsw.domain;

public record ParticipanteResponse(
        Long id,
        String name,
        String phone,
        String email,
        String institution,
        String role
) {
}
