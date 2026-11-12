package com.sorteiofsw.service;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** Recusa no envio do certificado, com uma mensagem pronta para mostrar no painel. */
@Getter
public class EnvioCertificadoException extends RuntimeException {
    private final HttpStatus status;

    public EnvioCertificadoException(HttpStatus status, String mensagem) {
        super(mensagem);
        this.status = status;
    }
}
