package com.sorteiofsw.controller;

import com.sorteiofsw.service.EnvioCertificadosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Envio do certificado por e-mail. Tudo sob /participante/**, que o SecurityConfig já restringe ao admin. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/participante")
public class CertificadoController {
    private final EnvioCertificadosService envio;

    @GetMapping("/certificados/envio")
    public EnvioCertificadosService.Status status() {
        return envio.status();
    }

    @PostMapping("/certificados/envio")
    public ResponseEntity<EnvioCertificadosService.Status> enviarParaTodos() {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(envio.iniciarEnvioParaTodos());
    }

    @PostMapping("/certificados/envio/parar")
    public EnvioCertificadosService.Status parar() {
        return envio.parar();
    }

    public record ForaDoEnvioGeral(boolean fora) {
    }

    /** Marca (fora = true) ou desmarca quem não pode receber o certificado no envio geral. */
    @PutMapping("/{id}/certificado/fora-do-envio-geral")
    public ResponseEntity<Void> foraDoEnvioGeral(@PathVariable Long id, @RequestBody ForaDoEnvioGeral corpo) {
        envio.definirForaDoEnvioGeral(id, corpo.fora());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/certificado/email")
    public Map<String, String> enviarIndividual(@PathVariable Long id) {
        envio.enviarIndividual(id);
        return Map.of("mensagem", "Certificado enviado.");
    }
}
