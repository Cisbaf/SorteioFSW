package com.sorteiofsw.controller;

import com.sorteiofsw.domain.ParticipanteRequest;
import com.sorteiofsw.domain.ParticipanteResponse;
import com.sorteiofsw.service.ParticipanteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/participante")
public class ParticipanteController {
    private final ParticipanteService service;

    @GetMapping
    public ResponseEntity<List<ParticipanteResponse>> getParticipante() {
        return ResponseEntity.ok(service.getParticipante());
    }

    @PostMapping
    public ResponseEntity<ParticipanteResponse> createParticipante(@RequestBody @Valid ParticipanteRequest request) {
        return ResponseEntity.ok(service.createParticipante(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParticipante(@RequestParam Long id) {
        service.deleteParticipante(id);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
