package com.sorteiofsw.controller;

import com.sorteiofsw.service.EnvioCertificadoException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Void> handleDataIntegrityViolation() {
        return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

    @ExceptionHandler(EnvioCertificadoException.class)
    public ResponseEntity<Map<String, String>> handleEnvioCertificado(EnvioCertificadoException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of("mensagem", e.getMessage()));
    }
}
