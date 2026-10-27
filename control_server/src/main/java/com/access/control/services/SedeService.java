package com.access.control.services;

import com.access.control.model.Sede;
import java.util.List;

public interface SedeService {
    Sede getSedeById(Long id);
    List<Sede> getListSedes();
    Sede addSede(Sede sede);
    Sede updateSede(Sede sede, Long id);
    boolean deleteSede(Sede sede);
}
