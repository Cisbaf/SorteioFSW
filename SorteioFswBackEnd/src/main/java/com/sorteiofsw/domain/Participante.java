package com.sorteiofsw.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class Participante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false,unique = true)
    private String name;
    @Column(nullable = false, length = 11)
    private String phone;
    @Column(nullable = false, length = 50)
    private String email;
    @Column(nullable = false, length = 60)
    private String institution;
    @Column(nullable = false, length = 50)
    private String role;

    public Participante(String name, String phone, String email, String institution, String role) {
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.institution = institution;
        this.role = role;
    }
}
