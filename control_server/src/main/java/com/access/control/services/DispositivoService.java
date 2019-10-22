package com.access.control.services;

import com.access.control.model.Dispositivo;
import org.springframework.http.ResponseEntity;

import java.util.List;
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

    Boolean deleteById(Long id);

    Boolean deleteDispositivo(Dispositivo obj);
}
