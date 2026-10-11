package com.access.control.services;

import com.access.control.model.Piso;
import java.util.List;

public interface PisoService {
    Piso getPisoById(Long id);
    List<Piso> getListPisos();
    Piso addPiso(Piso piso);
    Piso updatePiso(Piso piso, Long id);
    boolean deletePiso(Piso piso);
}
