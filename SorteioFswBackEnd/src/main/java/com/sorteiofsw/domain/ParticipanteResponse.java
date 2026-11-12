package com.sorteiofsw.domain;

import java.time.LocalDateTime;

public record ParticipanteResponse(
        Long id,
        String name,
        String phone,
        String email,
        String institution,
        String role,
        LocalDateTime certificadoEnviadoEm,
        String certificadoErro,
        boolean foraDoEnvioGeral
) {
}
