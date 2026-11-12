package com.sorteiofsw.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    /** Quando o certificado foi enviado por e-mail pela última vez (null = nunca). Colunas nulas: o ddl-auto=update as cria sem mexer nos dados. */
    private LocalDateTime certificadoEnviadoEm;
    /** Motivo da última falha de envio do certificado (null = sem falha pendente). */
    @Column(length = 255)
    private String certificadoErro;
    /** Marcado pelo admin: não entra no envio geral de certificados (null = entra). Nulo pelo mesmo motivo acima. */
    private Boolean foraDoEnvioGeral;

    public Participante(String name, String phone, String email, String institution, String role) {
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.institution = institution;
        this.role = role;
    }

    public void registrarCertificadoEnviado(LocalDateTime quando) {
        this.certificadoEnviadoEm = quando;
        this.certificadoErro = null;
    }

    public boolean estaForaDoEnvioGeral() {
        return Boolean.TRUE.equals(foraDoEnvioGeral);
    }

    public void definirForaDoEnvioGeral(boolean fora) {
        this.foraDoEnvioGeral = fora;
    }

    public void registrarFalhaCertificado(String motivo) {
        this.certificadoErro = motivo == null ? "Falha desconhecida" : motivo.substring(0, Math.min(motivo.length(), 255));
    }
}
