package com.access.control.services;

import com.access.control.model.Dispositivo;
import java.util.List;

public interface DispositivoService {
    Dispositivo getDispositivoById(Long id);
    List<Dispositivo> getListDispositivos();
    Dispositivo addDispositivo(Dispositivo dispositivo);
    Dispositivo updateDispositivo(Dispositivo dispositivo, Long id);
    boolean deleteDispositivo(Dispositivo dispositivo);
}
