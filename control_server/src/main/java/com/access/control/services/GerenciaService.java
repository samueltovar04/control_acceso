package com.access.control.services;

import com.access.control.model.Gerencia;
import java.util.List;

public interface GerenciaService {
    Gerencia getGerenciaById(Long id);
    List<Gerencia> getListGerencias();
    Gerencia addGerencia(Gerencia gerencia);
    Gerencia updateGerencia(Gerencia gerencia, Long id);
    boolean deleteGerencia(Gerencia gerencia);
}
