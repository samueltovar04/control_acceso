package com.access.control.services;

import com.access.control.model.Gerencia;

import java.util.List;
import java.util.Optional;

public interface GerenciaService {
    List<Gerencia> getListGerencias(Object... params);
    Gerencia getGerencia(Gerencia params);
    Optional<Gerencia> findById(Long id);
    Gerencia getGerenciaById(Long id);
    Gerencia addGerencia(Gerencia obj);
    Gerencia updateGerencia(Gerencia obj, Long id);
    Boolean deleteGerencia(Gerencia obj);
}
