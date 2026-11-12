package com.sorteiofsw.controller;

import com.sorteiofsw.domain.ParticipanteRequest;
import com.sorteiofsw.domain.ParticipanteResponse;
import com.sorteiofsw.service.CertificadoService;
import com.sorteiofsw.service.ExcelService;
import com.sorteiofsw.service.ParticipanteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/participante")
public class ParticipanteController {
    private final ParticipanteService service;
    private final ExcelService excelService;
    private final CertificadoService certificadoService;

    @GetMapping
    public ResponseEntity<List<ParticipanteResponse>> getParticipante() {
        return ResponseEntity.ok(service.getParticipante());
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel() {
        var arquivo = excelService.gerar(service.getParticipante());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(ExcelService.TIPO))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(arquivo.nome(), StandardCharsets.UTF_8).build().toString())
                .body(arquivo.bytes());
    }

    @GetMapping("/{id}/certificado")
    public ResponseEntity<byte[]> certificado(@PathVariable Long id) {
        var arquivo = certificadoService.gerar(service.getParticipante(id).name());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(CertificadoService.TIPO))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(arquivo.nome(), StandardCharsets.UTF_8).build().toString())
                .body(arquivo.bytes());
    }

    @PostMapping
    public ResponseEntity<ParticipanteResponse> createParticipante(@RequestBody @Valid ParticipanteRequest request) {
        return ResponseEntity.ok(service.createParticipante(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParticipante(@PathVariable Long id) {
        service.deleteParticipante(id);
        return ResponseEntity.noContent().build();
    }
}
