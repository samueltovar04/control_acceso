package com.access.control.services;

import com.access.control.model.Piso;

import java.util.List;
import java.util.Optional;

public interface PisoService {
    List<Piso> getListPisos(Object... params);
    Piso getPiso(Piso params);
    Optional<Piso> findById(Long id);
    Piso getPisoById(Long id);
    Piso addPiso(Piso obj);
    Piso updatePiso(Piso obj, Long id);
    Boolean deletePiso(Piso obj);
}
