package com.sorteiofsw.service;

import com.sorteiofsw.domain.Participante;
import com.sorteiofsw.repository.ParticipanteRepository;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EnvioCertificadosServiceTest {

    private final ParticipanteRepository repository = mock(ParticipanteRepository.class);
    private final CertificadoEmailService email = mock(CertificadoEmailService.class);

    private Participante participante(long id) {
        var p = new Participante("Pessoa " + id + " Silva", "21987654321", "p" + id + "@exemplo.com", "CISBAF", "Prefeito");
        try {
            var campo = Participante.class.getDeclaredField("id");
            campo.setAccessible(true);
            campo.set(p, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
        when(repository.findById(id)).thenReturn(Optional.of(p));
        return p;
    }

    private EnvioCertificadosService service(int limite24h, int maxFalhas) {
        when(email.configurado()).thenReturn(true);
        return new EnvioCertificadosService(repository, email, 3, limite24h, maxFalhas);
    }

    @Test
    void falhaDeLoginPausaAFilaNoPrimeiroEmail() {
        var p1 = participante(1);
        participante(2);
        when(repository.idsSemCertificado()).thenReturn(List.of(1L, 2L));
        when(repository.contarNaFilaDoEnvioGeral()).thenReturn(2L);
        doThrow(new MailAuthenticationException("535 bad credentials")).when(email).enviar(any());

        var service = service(400, 5);
        service.iniciarEnvioParaTodos();

        await().atMost(Duration.ofSeconds(5)).until(() -> service.status().estado() == EnvioCertificadosService.Estado.PAUSADO_ERRO);
        verify(email, times(1)).enviar(any());
        assertThat(p1.getCertificadoErro()).contains("recusou o login");
        assertThat(p1.getCertificadoEnviadoEm()).isNull();
    }

    @Test
    void falhasSeguidasPausamPorSeguranca() {
        participante(1);
        participante(2);
        participante(3);
        when(repository.idsSemCertificado()).thenReturn(List.of(1L, 2L, 3L));
        when(repository.contarNaFilaDoEnvioGeral()).thenReturn(3L);
        doThrow(new MailSendException("421 temporariamente indisponível")).when(email).enviar(any());

        var service = service(400, 2);
        service.iniciarEnvioParaTodos();

        await().atMost(Duration.ofSeconds(10)).until(() -> service.status().estado() == EnvioCertificadosService.Estado.PAUSADO_ERRO);
        verify(email, times(2)).enviar(any());
        assertThat(service.status().mensagem()).contains("2 falhas seguidas");
    }

    @Test
    void enviaTodosEMarcaComoEnviado() {
        var p1 = participante(1);
        var p2 = participante(2);
        when(repository.idsSemCertificado()).thenReturn(List.of(1L, 2L));
        when(repository.contarNaFilaDoEnvioGeral()).thenReturn(2L);

        var service = service(400, 5);
        service.iniciarEnvioParaTodos();

        await().atMost(Duration.ofSeconds(10)).until(() -> service.status().estado() == EnvioCertificadosService.Estado.CONCLUIDO);
        assertThat(p1.getCertificadoEnviadoEm()).isNotNull();
        assertThat(p2.getCertificadoEnviadoEm()).isNotNull();
        assertThat(service.status().enviadosNestaRodada()).isEqualTo(2);
    }

    @Test
    void quemFoiTiradoDoEnvioGeralNaoRecebe() {
        var p1 = participante(1);
        var p2 = participante(2);
        when(repository.idsSemCertificado()).thenReturn(List.of(1L, 2L));
        when(repository.contarNaFilaDoEnvioGeral()).thenReturn(2L);

        var service = service(400, 5);
        // Tirado depois de a fila ser montada: tem que ser pulado mesmo assim.
        service.definirForaDoEnvioGeral(2L, true);
        service.iniciarEnvioParaTodos();

        await().atMost(Duration.ofSeconds(10)).until(() -> service.status().estado() == EnvioCertificadosService.Estado.CONCLUIDO);
        verify(email, times(1)).enviar(p1);
        verify(email, never()).enviar(p2);
        assertThat(p2.getCertificadoEnviadoEm()).isNull();
        assertThat(p2.estaForaDoEnvioGeral()).isTrue();
    }

    @Test
    void recusaQuandoOLimiteDe24hFoiAtingido() {
        participante(1);
        when(repository.contarNaFilaDoEnvioGeral()).thenReturn(1L);
        when(repository.countByCertificadoEnviadoEmAfter(any())).thenReturn(10L);

        var service = service(10, 5);
        assertThatThrownBy(service::iniciarEnvioParaTodos)
                .isInstanceOfSatisfying(EnvioCertificadoException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        assertThatThrownBy(() -> service.enviarIndividual(1L))
                .isInstanceOfSatisfying(EnvioCertificadoException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        verify(email, never()).enviar(any());
    }

    @Test
    void semConfiguracaoNaoEnvia() {
        when(email.configurado()).thenReturn(false);
        var service = new EnvioCertificadosService(repository, email, 15, 400, 5);
        assertThatThrownBy(() -> service.enviarIndividual(1L))
                .isInstanceOfSatisfying(EnvioCertificadoException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }

    @Test
    void emailTemUmDestinatarioRemetenteComNomeCertificadoECarta() throws Exception {
        var sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
        var service = new CertificadoEmailService(sender, new CertificadoService(), "certificados@cisbaf.org.br", "senha-de-app",
                "CISBAF", "contato@cisbaf.org.br");

        service.enviar(new Participante("Maria Souza", "21987654321", "maria@exemplo.com", "CISBAF", "Prefeito"));

        var captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(captor.capture());
        var mensagem = captor.getValue();
        mensagem.saveChanges();
        assertThat(mensagem.getRecipients(Message.RecipientType.TO)).extracting(Object::toString).containsExactly("maria@exemplo.com");
        assertThat(mensagem.getRecipients(Message.RecipientType.BCC)).isNull();
        assertThat(mensagem.getFrom()[0].toString()).isEqualTo("CISBAF <certificados@cisbaf.org.br>");
        assertThat(mensagem.getReplyTo()[0].toString()).isEqualTo("contato@cisbaf.org.br");
        assertThat(mensagem.getSubject()).isEqualTo(CertificadoEmailService.ASSUNTO);
        assertThat(mensagem.getHeader("Auto-Submitted")).containsExactly("auto-generated");

        var corpo = (MimeMultipart) mensagem.getContent();
        var certificado = corpo.getBodyPart(corpo.getCount() - 2);
        assertThat(certificado.getFileName()).isEqualTo("certificado-maria-souza.jpg");
        assertThat(certificado.getContentType()).startsWith("image/jpeg");
        var carta = corpo.getBodyPart(corpo.getCount() - 1);
        assertThat(carta.getFileName()).isEqualTo(CertificadoEmailService.CARTA_NOME);
        assertThat(carta.getContentType()).startsWith("application/pdf");
        // Os dois anexos juntos (em base64) seguem leves.
        assertThat(certificado.getSize() + carta.getSize()).isLessThan(4_000_000);
    }
}
