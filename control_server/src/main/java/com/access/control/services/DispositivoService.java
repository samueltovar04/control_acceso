package com.access.control.services;

import com.access.control.model.Dispositivo;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface DispositivoService {
    List<Dispositivo> getListDispositivos();

    List<Dispositivo> findAllEnabled();

    Optional<Dispositivo> findById(Long id);

    Dispositivo getDispositivoById(Long id);

    Dispositivo getOneDispositivo(Long id);

    ResponseEntity<List<Dispositivo>> getListDispositivosActivos();

    Dispositivo addDispositivo(Dispositivo stock);

    Dispositivo updateDispositivo(Dispositivo dispositivo, Long id);

    Dispositivo saveDispositivo(Dispositivo dispositivo);

    Boolean deleteById(Long id);

    Boolean deleteDispositivo(Dispositivo obj);

    ResponseEntity<Map<String, String>> checkFingerPrint();

    ResponseEntity<Map<String, String>> getHuella();
}
