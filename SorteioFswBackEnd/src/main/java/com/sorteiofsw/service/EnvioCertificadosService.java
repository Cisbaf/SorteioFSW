package com.sorteiofsw.service;

import com.sorteiofsw.domain.Participante;
import com.sorteiofsw.repository.ParticipanteRepository;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Envio dos certificados por e-mail, individual ou para todos. O envio para todos roda em segundo plano com cautela
 * para o Gmail não tratar como spam: um e-mail por vez com pausa entre eles, teto de envios em 24 h (contado no banco,
 * vale também para os individuais e sobrevive a reinício) e parada automática em falha de login, cota esgotada ou
 * várias falhas seguidas. Só entra na fila quem ainda não recebeu, então dá para parar e continuar depois sem repetir.
 * Quem o admin marcou como "fora do envio geral" nunca entra na fila (só recebe por envio individual).
 */
@Slf4j
@Service
public class EnvioCertificadosService {

    public enum Estado { PARADO, ENVIANDO, CONCLUIDO, INTERROMPIDO, PAUSADO_LIMITE, PAUSADO_ERRO }

    public record Status(
            boolean emailConfigurado,
            Estado estado,
            String mensagem,
            String enviandoPara,
            int enviadosNestaRodada,
            int falhasNestaRodada,
            long semCertificado,
            long foraDoEnvioGeral,
            long comCertificado,
            long enviadosUltimas24h,
            int limite24h,
            int intervaloSegundos
    ) {
    }

    private final ParticipanteRepository repository;
    private final CertificadoEmailService email;
    private final int intervaloSegundos;
    private final int limite24h;
    private final int maxFalhasSeguidas;
    private final Clock clock = Clock.systemDefaultZone();
    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "envio-certificados");
        t.setDaemon(true);
        return t;
    });

    private volatile Estado estado = Estado.PARADO;
    private volatile String mensagem;
    private volatile String enviandoPara;
    private volatile int enviados;
    private volatile int falhas;
    private volatile boolean pararSolicitado;

    public EnvioCertificadosService(ParticipanteRepository repository,
                                    CertificadoEmailService email,
                                    @Value("${certificado.email.intervalo-segundos:15}") int intervaloSegundos,
                                    @Value("${certificado.email.limite-24h:400}") int limite24h,
                                    @Value("${certificado.email.max-falhas-seguidas:5}") int maxFalhasSeguidas) {
        this.repository = repository;
        this.email = email;
        this.intervaloSegundos = Math.max(intervaloSegundos, 3);
        this.limite24h = Math.max(limite24h, 1);
        this.maxFalhasSeguidas = Math.max(maxFalhasSeguidas, 1);
    }

    public Status status() {
        return new Status(email.configurado(), estado, mensagem, enviandoPara, enviados, falhas,
                repository.contarNaFilaDoEnvioGeral(), repository.contarForaDoEnvioGeral(),
                repository.countByCertificadoEnviadoEmIsNotNull(),
                enviadosUltimas24h(), limite24h, intervaloSegundos);
    }

    /** Envio individual: sempre envia, mesmo para quem já recebeu (é uma ação explícita do admin). */
    public void enviarIndividual(Long id) {
        exigirConfiguracao();
        exigirCota();
        Participante participante = repository.findById(id)
                .orElseThrow(() -> new EnvioCertificadoException(HttpStatus.NOT_FOUND, "Participante não encontrado."));
        try {
            email.enviar(participante);
        } catch (RuntimeException e) {
            String motivo = CertificadoEmailService.motivo(e);
            log.warn("Falha ao enviar certificado do participante {}: {}", id, motivo);
            participante.registrarFalhaCertificado(motivo);
            repository.save(participante);
            throw new EnvioCertificadoException(HttpStatus.BAD_GATEWAY, motivo);
        }
        participante.registrarCertificadoEnviado(LocalDateTime.now(clock));
        repository.save(participante);
    }

    /** Tira (ou devolve) um participante do envio geral. Vale também para um envio em andamento. */
    public void definirForaDoEnvioGeral(Long id, boolean fora) {
        Participante participante = repository.findById(id)
                .orElseThrow(() -> new EnvioCertificadoException(HttpStatus.NOT_FOUND, "Participante não encontrado."));
        participante.definirForaDoEnvioGeral(fora);
        repository.save(participante);
    }

    public synchronized Status iniciarEnvioParaTodos() {
        exigirConfiguracao();
        if (estado == Estado.ENVIANDO) {
            throw new EnvioCertificadoException(HttpStatus.CONFLICT, "Já existe um envio em andamento.");
        }
        if (repository.contarNaFilaDoEnvioGeral() == 0) {
            throw new EnvioCertificadoException(HttpStatus.CONFLICT, "Todos os participantes do envio geral já receberam o certificado.");
        }
        exigirCota();

        enviados = 0;
        falhas = 0;
        enviandoPara = null;
        pararSolicitado = false;
        mensagem = "Enviando, um e-mail a cada " + intervaloSegundos + " segundos.";
        estado = Estado.ENVIANDO;
        executor.submit(this::executarFila);
        return status();
    }

    public Status parar() {
        if (estado == Estado.ENVIANDO) {
            pararSolicitado = true;
            mensagem = "Parando depois do e-mail atual...";
        }
        return status();
    }

    private void executarFila() {
        int falhasSeguidas = 0;
        try {
            var fila = repository.idsSemCertificado();
            for (int i = 0; i < fila.size(); i++) {
                if (pararSolicitado) {
                    finalizar(Estado.INTERROMPIDO, "Envio interrompido. Clique em \"Enviar para todos\" para continuar de onde parou.");
                    return;
                }
                if (enviadosUltimas24h() >= limite24h) {
                    finalizar(Estado.PAUSADO_LIMITE, "Limite de " + limite24h + " e-mails em 24 horas atingido (proteção contra bloqueio). "
                            + "Clique em \"Enviar para todos\" mais tarde para continuar de onde parou.");
                    return;
                }

                // Pode ter sido excluído, tirado do envio geral ou recebido pelo envio individual enquanto a fila andava.
                var participante = repository.findById(fila.get(i)).orElse(null);
                if (participante == null || participante.getCertificadoEnviadoEm() != null || participante.estaForaDoEnvioGeral()) continue;

                enviandoPara = participante.getName();
                try {
                    email.enviar(participante);
                    participante.registrarCertificadoEnviado(LocalDateTime.now(clock));
                    repository.save(participante);
                    enviados++;
                    falhasSeguidas = 0;
                } catch (RuntimeException e) {
                    String motivo = CertificadoEmailService.motivo(e);
                    log.warn("Falha ao enviar certificado do participante {}: {}", participante.getId(), motivo);
                    participante.registrarFalhaCertificado(motivo);
                    repository.save(participante);
                    falhas++;
                    falhasSeguidas++;
                    if (CertificadoEmailService.falhaGeral(e)) {
                        finalizar(Estado.PAUSADO_ERRO, motivo + " O envio foi pausado.");
                        return;
                    }
                    if (falhasSeguidas >= maxFalhasSeguidas) {
                        finalizar(Estado.PAUSADO_ERRO, falhasSeguidas + " falhas seguidas; o envio foi pausado por segurança. Última: " + motivo);
                        return;
                    }
                }
                enviandoPara = null;
                if (i < fila.size() - 1) aguardarIntervalo();
            }
            finalizar(Estado.CONCLUIDO, falhas == 0
                    ? "Envio concluído."
                    : "Envio concluído, com " + falhas + " falha(s). Veja os participantes marcados na lista.");
        } catch (RuntimeException e) {
            log.error("Erro inesperado no envio de certificados", e);
            finalizar(Estado.PAUSADO_ERRO, "Erro inesperado no envio: " + CertificadoEmailService.motivo(e));
        }
    }

    /** Pausa entre e-mails com uma pequena variação aleatória; o pedido de parar é atendido no meio da pausa. */
    private void aguardarIntervalo() {
        long fim = System.currentTimeMillis() + intervaloSegundos * 1000L + ThreadLocalRandom.current().nextLong(0, 3000);
        while (!pararSolicitado && System.currentTimeMillis() < fim) {
            try {
                Thread.sleep(250);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                pararSolicitado = true;
            }
        }
    }

    private void finalizar(Estado novoEstado, String novaMensagem) {
        enviandoPara = null;
        mensagem = novaMensagem;
        estado = novoEstado;
        log.info("Envio de certificados: {} - {} enviados, {} falhas. {}", novoEstado, enviados, falhas, novaMensagem);
    }

    private long enviadosUltimas24h() {
        return repository.countByCertificadoEnviadoEmAfter(LocalDateTime.now(clock).minus(Duration.ofHours(24)));
    }

    private void exigirConfiguracao() {
        if (!email.configurado()) {
            throw new EnvioCertificadoException(HttpStatus.SERVICE_UNAVAILABLE,
                    "O e-mail de envio ainda não foi configurado (MAIL_USERNAME e MAIL_PASSWORD no .env do backend).");
        }
    }

    private void exigirCota() {
        if (enviadosUltimas24h() >= limite24h) {
            throw new EnvioCertificadoException(HttpStatus.TOO_MANY_REQUESTS,
                    "Limite de " + limite24h + " e-mails em 24 horas atingido (proteção contra bloqueio). Tente mais tarde.");
        }
    }

    @PreDestroy
    void encerrar() {
        pararSolicitado = true;
        executor.shutdownNow();
    }
}
