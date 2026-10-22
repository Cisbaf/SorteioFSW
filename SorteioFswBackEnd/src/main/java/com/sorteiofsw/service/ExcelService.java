package com.sorteiofsw.service;

import com.sorteiofsw.domain.ParticipanteResponse;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Planilha dos participantes. Todo valor entra como texto (nunca como formula), entao um nome ou cargo que comece
 * com "=" nao e executado pelo Excel. O telefone fica como texto formatado para nao perder o zero nem virar numero.
 */
@Service
public class ExcelService {

    public static final String TIPO = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static final String[] COLUNAS = {"Nº", "Nome", "WhatsApp", "E-mail", "Instituição", "Cargo / função"};
    private static final int LARGURA_MAX = 60;

    public record Arquivo(byte[] bytes, String nome) {
    }

    public Arquivo gerar(List<ParticipanteResponse> participantes) {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Participantes");
            CellStyle cabecalho = estiloCabecalho(wb);
            CellStyle texto = estiloTexto(wb);

            int[] larguras = new int[COLUNAS.length];
            Row cab = sheet.createRow(0);
            cab.setHeightInPoints(24);
            for (int c = 0; c < COLUNAS.length; c++) {
                Cell cell = cab.createCell(c);
                cell.setCellValue(COLUNAS[c]);
                cell.setCellStyle(cabecalho);
                larguras[c] = COLUNAS[c].length() + 4;
            }

            var ordenados = participantes.stream().sorted(Comparator.comparing(ParticipanteResponse::id)).toList();
            int linha = 1;
            for (ParticipanteResponse p : ordenados) {
                Row row = sheet.createRow(linha);
                String[] valores = {
                        String.valueOf(linha), p.name(), formatarTelefone(p.phone()), p.email(), p.institution(), p.role()
                };
                for (int c = 0; c < valores.length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(valores[c]);
                    cell.setCellStyle(texto);
                    larguras[c] = Math.max(larguras[c], Math.min(LARGURA_MAX, valores[c].length() + 3));
                }
                linha++;
            }

            for (int c = 0; c < COLUNAS.length; c++) sheet.setColumnWidth(c, larguras[c] * 256);
            sheet.createFreezePane(0, 1);
            sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(0, Math.max(0, linha - 1), 0, COLUNAS.length - 1));

            var saida = new ByteArrayOutputStream();
            wb.write(saida);
            return new Arquivo(saida.toByteArray(), "participantes-sorteio-cisbaf-" + LocalDate.now() + ".xlsx");
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String formatarTelefone(String telefone) {
        if (telefone == null) return "";
        String d = telefone.replaceAll("\\D", "");
        if (d.length() == 11) return "(" + d.substring(0, 2) + ") " + d.substring(2, 7) + "-" + d.substring(7);
        if (d.length() == 10) return "(" + d.substring(0, 2) + ") " + d.substring(2, 6) + "-" + d.substring(6);
        return telefone;
    }

    private static CellStyle estiloCabecalho(Workbook wb) {
        Font fonte = wb.createFont();
        fonte.setBold(true);
        fonte.setColor(IndexedColors.WHITE.getIndex());
        CellStyle s = wb.createCellStyle();
        s.setFont(fonte);
        s.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.LEFT);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        return s;
    }

    private static CellStyle estiloTexto(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        s.setBorderBottom(BorderStyle.HAIR);
        s.setBottomBorderColor(IndexedColors.GREY_40_PERCENT.getIndex());
        return s;
    }
}
