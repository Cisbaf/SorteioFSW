package com.sorteiofsw.domain;

import java.util.List;

public record UserResponse(
        String username,
        List<String> roles
) {
}
