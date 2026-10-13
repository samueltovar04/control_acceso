package com.access.control.services;

import com.access.control.model.Dispositivo;
import java.util.List;

public interface DispositivoService {
    Dispositivo getDispositivoById(Long id);
    List<Dispositivo> getListDispositivos();
    List<Dispositivo> findAllEnabled();
    Dispositivo addDispositivo(Dispositivo dispositivo);
    Dispositivo updateDispositivo(Dispositivo dispositivo, Long id);
    Dispositivo toggleState(Long id);
    boolean deleteDispositivo(Dispositivo dispositivo);
    boolean checkPing(Dispositivo dispositivo);
    List<Dispositivo> pingAllDispositivos();
    com.access.control.dto.DispositivoEscaneoDTO escanearDispositivo(Long id);
    List<com.access.control.dto.DispositivoDescubiertoDTO> descubrirDispositivosNoRegistrados();
    List<Dispositivo> registrarLote(List<Dispositivo> dispositivos);
}
