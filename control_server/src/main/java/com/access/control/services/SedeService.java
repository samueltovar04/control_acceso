package com.access.control.services;

import com.access.control.model.Sede;

import java.util.List;
import java.util.Optional;

public interface SedeService {
    List<Sede> getListSedes(Object... params);
    Sede getSede(Sede params);
    Optional<Sede> findById(Long id);
    Sede getSedeById(Long id);
    Sede addSede(Sede obj);
    Sede updateSede(Sede obj, Long id);
    Boolean deleteSede(Sede obj);
}
