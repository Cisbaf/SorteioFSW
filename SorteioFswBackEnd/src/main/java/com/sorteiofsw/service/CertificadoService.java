package com.sorteiofsw.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.awt.*;
import java.awt.font.TextAttribute;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;

/**
 * Escreve o nome do participante na arte do certificado. A arte vem com "[NOME DO PARTICIPANTE]" escrito: o texto é
 * coberto com o mesmo azul do fundo e o nome entra no mesmo lugar, em maiúsculas douradas e condensadas como o original.
 * O resultado sai em JPEG. As medidas abaixo são da imagem resources/certificado/modelo.jpg (3840x2715, 4K).
 */
@Service
public class CertificadoService {

    public static final String TIPO = "image/jpeg";

    private static final Color FUNDO = new Color(10, 28, 61);
    private static final Color DOURADO = new Color(243, 180, 25);
    /** Retângulo que cobre o texto de exemplo, sem encostar na linha divisória logo abaixo (y = 1275). */
    private static final Rectangle AREA_EXEMPLO = new Rectangle(450, 1098, 1653, 168);
    private static final int CENTRO_X = 1275;
    private static final int LINHA_BASE = 1233;
    private static final int LARGURA_MAX = 1800;
    private static final float TAMANHO = 126f;
    /** A fonte original (estilo Oswald) é mais estreita que a Noto: achatar na horizontal deixa as duas iguais. */
    private static final double ESCALA_X = 0.85;
    private static final float ESPACAMENTO = 0.05f;
    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

    private final BufferedImage modelo;
    private final Font fonte;

    public CertificadoService() {
        try (InputStream imagem = new ClassPathResource("certificado/modelo.jpg").getInputStream();
             InputStream ttf = new ClassPathResource("certificado/NotoSans-ExtraCondensedBold.ttf").getInputStream()) {
            this.modelo = ImageIO.read(imagem);
            this.fonte = Font.createFont(Font.TRUETYPE_FONT, ttf)
                    .deriveFont(Map.of(TextAttribute.TRACKING, ESPACAMENTO));
        } catch (IOException | FontFormatException e) {
            throw new IllegalStateException("Não foi possível carregar a arte ou a fonte do certificado.", e);
        }
    }

    public record Arquivo(byte[] bytes, String nome) {
    }

    public Arquivo gerar(String nomeParticipante) {
        String texto = nomeParticipante.trim().replaceAll("\\s+", " ").toUpperCase(PT_BR);

        BufferedImage imagem = new BufferedImage(modelo.getWidth(), modelo.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = imagem.createGraphics();
        try {
            g.drawImage(modelo, 0, 0, null);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

            g.setColor(FUNDO);
            g.fill(AREA_EXEMPLO);

            // Nome comprido: diminui a fonte (mantendo a linha de base) até caber na largura do quadro.
            Font fonteNome = fonte.deriveFont(AffineTransform.getScaleInstance(ESCALA_X, 1)).deriveFont(TAMANHO);
            g.setFont(fonteNome);
            double largura = g.getFontMetrics().getStringBounds(texto, g).getWidth();
            if (largura > LARGURA_MAX) {
                fonteNome = fonteNome.deriveFont((float) (TAMANHO * LARGURA_MAX / largura));
                g.setFont(fonteNome);
                largura = g.getFontMetrics().getStringBounds(texto, g).getWidth();
            }

            g.setColor(DOURADO);
            g.drawString(texto, (float) (CENTRO_X - largura / 2), LINHA_BASE);
        } finally {
            g.dispose();
        }

        return new Arquivo(jpeg(imagem), "certificado-" + nomeArquivo(nomeParticipante) + ".jpg");
    }

    /** JPEG em vez de PNG: a arte é uma foto, e em 4K o PNG passaria de 10 MB (anexo leve ajuda a não cair no spam). */
    private static byte[] jpeg(BufferedImage imagem) {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        var saida = new ByteArrayOutputStream();
        try (var stream = new MemoryCacheImageOutputStream(saida)) {
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(0.92f);
            writer.setOutput(stream);
            writer.write(null, new IIOImage(imagem, null, null), param);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        } finally {
            writer.dispose();
        }
        return saida.toByteArray();
    }

    /** "José da Silva" -> "jose-da-silva", para o nome do arquivo baixado ou anexado. */
    private static String nomeArquivo(String nome) {
        String semAcento = Normalizer.normalize(nome, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String slug = semAcento.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return slug.isEmpty() ? "participante" : slug;
    }
}
