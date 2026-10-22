package com.sorteiofsw.service;

import com.sorteiofsw.domain.Participante;
import com.sorteiofsw.domain.ParticipanteRequest;
import com.sorteiofsw.domain.ParticipanteResponse;
import com.sorteiofsw.repository.ParticipanteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ParticipanteService {
    private final ParticipanteRepository participanteRepository;

    public List<ParticipanteResponse> getParticipante() {
        return participanteRepository.findAll().stream().map(this::mapResponse).toList();
    }

    @Transactional
    public ParticipanteResponse createParticipante(ParticipanteRequest request) {
        var participante = participanteRepository.save(mapEntity(request));
        return mapResponse(participante);
    }

    public void deleteParticipante(Long id){
        participanteRepository.deleteById(id);
    }


    private ParticipanteResponse mapResponse(Participante participante) {
        return new ParticipanteResponse(
                participante.getId(),
                participante.getName(),
                participante.getPhone(),
                participante.getEmail(),
                participante.getInstitution(),
                participante.getRole()
        );
    }

    private Participante mapEntity(ParticipanteRequest request) {
        return new Participante(
                request.name(),
                request.phone(),
                request.email(),
                request.institution(),
                request.role()
        );
    }
}
