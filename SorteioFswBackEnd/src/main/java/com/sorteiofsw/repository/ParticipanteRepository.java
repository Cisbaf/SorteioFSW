package com.sorteiofsw.repository;

import com.sorteiofsw.domain.Participante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ParticipanteRepository extends JpaRepository<Participante, Long> {

    String NA_FILA = "(p.foraDoEnvioGeral is null or p.foraDoEnvioGeral = false)";

    /** Fila do envio em massa: quem ainda não recebeu o certificado e não foi tirado do envio geral, na ordem de inscrição. */
    @Query("select p.id from Participante p where p.certificadoEnviadoEm is null and " + NA_FILA + " order by p.id")
    List<Long> idsSemCertificado();

    @Query("select count(p) from Participante p where p.certificadoEnviadoEm is null and " + NA_FILA)
    long contarNaFilaDoEnvioGeral();

    @Query("select count(p) from Participante p where p.certificadoEnviadoEm is null and p.foraDoEnvioGeral = true")
    long contarForaDoEnvioGeral();

    long countByCertificadoEnviadoEmIsNotNull();

    long countByCertificadoEnviadoEmAfter(LocalDateTime instante);
}
