package com.sorteiofsw.service;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CertificadoServiceTest {

    private final CertificadoService service = new CertificadoService();

    @Test
    void geraJpegDoTamanhoDaArteComNomeDoArquivoSemAcento() throws IOException {
        var arquivo = service.gerar("José da Silva Conceição");

        var imagem = ImageIO.read(new ByteArrayInputStream(arquivo.bytes()));
        assertEquals(3840, imagem.getWidth());
        assertEquals(2715, imagem.getHeight());
        assertEquals("certificado-jose-da-silva-conceicao.jpg", arquivo.nome());

        // Para conferir o visual: mvn test -Dcertificado.saida=/algum/diretorio
        String saida = System.getProperty("certificado.saida");
        if (saida != null) {
            Files.write(Path.of(saida, arquivo.nome()), arquivo.bytes());
            var longo = service.gerar("Maria Aparecida dos Santos Albuquerque de Oliveira Figueiredo");
            Files.write(Path.of(saida, longo.nome()), longo.bytes());
        }
    }
}
