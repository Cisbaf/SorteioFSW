package com.sorteiofsw.domain;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ParticipanteRequest(
        @NotBlank
        String name,
        @Pattern(regexp = "^(?:(?:\\+|00)?55\\s?)?(?:\\(?[1-9][0-9]\\)?\\s?)?(?:9\\d|[2-9])\\d{3}-?\\d{4}$")
        @NotBlank
        String phone,
        @Email
        @NotBlank
        String email,
        @NotBlank
        String institution,
        @NotBlank
        String role
) {
}
