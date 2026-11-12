package com.sorteiofsw.service;

import com.sorteiofsw.domain.Participante;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.io.UnsupportedEncodingException;
import java.util.Locale;

/**
 * Monta e envia o e-mail com o certificado de um participante. Um destinatário por mensagem (nada de lista em cópia),
 * texto simples + HTML sem imagens externas nem links, e anexos leves: o tipo de mensagem que filtros de spam aceitam.
 * Vão anexados o certificado e a Carta do Summit (resources/certificado/carta.pdf), igual para todos.
 * É um e-mail de "não responda": o Reply-To aponta para certificado.email.responder-para (naoresponda@cisbaf.org.br por
 * padrão), o texto pede para não responder e o cabeçalho Auto-Submitted evita respostas automáticas (férias, ausência).
 */
@Service
public class CertificadoEmailService {

    static final String ASSUNTO = "Seu certificado de participação – 1º Summit Brasileiro de Consórcios Públicos de Saúde";
    static final String CARTA_NOME = "Carta-I-Summit-Consorcios-Publicos-de-Saude.pdf";

    private final JavaMailSender mailSender;
    private final CertificadoService certificadoService;
    private final String usuario;
    private final String senha;
    private final String remetenteNome;
    private final String responderPara;
    private final byte[] carta;

    public CertificadoEmailService(JavaMailSender mailSender,
                                   CertificadoService certificadoService,
                                   @Value("${spring.mail.username:}") String usuario,
                                   @Value("${spring.mail.password:}") String senha,
                                   @Value("${certificado.email.remetente-nome:CISBAF}") String remetenteNome,
                                   @Value("${certificado.email.responder-para:naoresponda@cisbaf.org.br}") String responderPara) {
        this.mailSender = mailSender;
        this.certificadoService = certificadoService;
        this.usuario = usuario.trim();
        this.senha = senha;
        this.remetenteNome = remetenteNome.trim();
        this.responderPara = responderPara.trim();
        try (InputStream pdf = new ClassPathResource("certificado/carta.pdf").getInputStream()) {
            this.carta = pdf.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível carregar a carta do Summit.", e);
        }
    }

    public boolean configurado() {
        return !usuario.isEmpty() && !senha.isBlank();
    }

    public void enviar(Participante participante) {
        var certificado = certificadoService.gerar(participante.getName());
        var mensagem = mailSender.createMimeMessage();
        try {
            var helper = new MimeMessageHelper(mensagem, true, "UTF-8");
            helper.setFrom(new InternetAddress(usuario, remetenteNome, "UTF-8"));
            helper.setTo(participante.getEmail());
            if (!responderPara.isEmpty()) helper.setReplyTo(responderPara);
            helper.setSubject(ASSUNTO);
            mensagem.setHeader("Auto-Submitted", "auto-generated");
            String primeiroNome = participante.getName().trim().split("\\s+")[0];
            helper.setText(texto(primeiroNome), html(primeiroNome));
            helper.addAttachment(certificado.nome(), new ByteArrayResource(certificado.bytes()), CertificadoService.TIPO);
            helper.addAttachment(CARTA_NOME, new ByteArrayResource(carta), "application/pdf");
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new IllegalStateException("Não foi possível montar o e-mail do certificado.", e);
        }
        mailSender.send(mensagem);
    }

    private String texto(String primeiroNome) {
        return """
                Olá, %s!

                Obrigado por participar do 1º Summit Brasileiro de Consórcios Públicos de Saúde, realizado em \
                11 de novembro de 2026, durante o FSWK26, no Rio de Janeiro.

                Em anexo estão o seu certificado de participação e a Carta do I Summit Brasileiro de Consórcios \
                Públicos de Saúde.

                Atenciosamente,
                %s

                Este é um e-mail automático. Por favor, não responda.
                """.formatted(primeiroNome, remetenteNome);
    }

    private String html(String primeiroNome) {
        String nome = HtmlUtils.htmlEscape(primeiroNome);
        String assinatura = HtmlUtils.htmlEscape(remetenteNome);
        return """
                <!doctype html>
                <html lang="pt-BR"><body style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
                <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
                <p style="margin:0 0 16px;font-size:16px">Olá, <strong>%s</strong>!</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.5">Obrigado por participar do
                <strong>1º Summit Brasileiro de Consórcios Públicos de Saúde</strong>, realizado em 11 de novembro de 2026,
                durante o FSWK26, no Rio de Janeiro.</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.5">Em anexo estão o seu certificado de participação e a
                <strong>Carta do I Summit Brasileiro de Consórcios Públicos de Saúde</strong>.</p>
                <p style="margin:24px 0 0;font-size:15px">Atenciosamente,<br>%s</p>
                <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">
                Este é um e-mail automático. Por favor, não responda.</p>
                </div></body></html>
                """.formatted(nome, assinatura);
    }

    /** Motivo legível de uma falha de envio, para guardar no participante e mostrar no painel. */
    public static String motivo(Exception e) {
        if (e instanceof MailAuthenticationException) {
            return "O Gmail recusou o login. Confira MAIL_USERNAME e a senha de app (MAIL_PASSWORD).";
        }
        String detalhe = detalhe(e);
        String minusculo = detalhe.toLowerCase(Locale.ROOT);
        if (cotaEsgotada(e)) return "O Gmail informou que a cota de envio acabou. Tente de novo em 24 horas.";
        if (minusculo.contains("550") || minusculo.contains("553") || minusculo.contains("invalid address")
                || minusculo.contains("does not exist")) {
            return "Endereço de e-mail recusado: " + resumir(detalhe);
        }
        return "Falha ao enviar: " + resumir(detalhe);
    }

    /** Falhas que afetam todos os próximos envios: não adianta continuar a fila. */
    public static boolean falhaGeral(Exception e) {
        return e instanceof MailAuthenticationException || cotaEsgotada(e);
    }

    private static boolean cotaEsgotada(Exception e) {
        String d = detalhe(e).toLowerCase(Locale.ROOT);
        return d.contains("5.4.5") || d.contains("quota") || d.contains("limit exceeded") || d.contains("too many");
    }

    private static String detalhe(Throwable e) {
        Throwable atual = e;
        StringBuilder texto = new StringBuilder();
        while (atual != null && texto.length() < 600) {
            if (atual.getMessage() != null) texto.append(atual.getMessage()).append(' ');
            atual = atual.getCause() == atual ? null : atual.getCause();
        }
        if (e instanceof MailException m && m.getMessage() == null) texto.append(m.getClass().getSimpleName());
        return texto.toString().replaceAll("\\s+", " ").trim();
    }

    private static String resumir(String texto) {
        return texto.length() > 180 ? texto.substring(0, 180) + "…" : texto;
    }
}
