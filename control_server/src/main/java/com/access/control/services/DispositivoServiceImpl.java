package com.access.control.services;

import com.access.control.model.Dispositivo;
import com.access.control.repository.DispositivoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class DispositivoServiceImpl implements DispositivoService {

    @Inject
    DispositivoRepository dispositivoRepository;

    @Override
    public Dispositivo getDispositivoById(Long id) {
        return dispositivoRepository.findById(id);
    }

    @Override
    public List<Dispositivo> getListDispositivos() {
        return dispositivoRepository.listAll();
    }

    @Override
    @Transactional
    public Dispositivo addDispositivo(Dispositivo dispositivo) {
        dispositivoRepository.persist(dispositivo);
        return dispositivo;
    }

    @Override
    @Transactional
    public Dispositivo updateDispositivo(Dispositivo dispositivo, Long id) {
        Dispositivo d = dispositivoRepository.findById(id);
        if (d != null) {
            d.setNombre(dispositivo.getNombre());
            d.setIp(dispositivo.getIp());
            d.setTipo(dispositivo.getTipo());
            d.setUbicacion(dispositivo.getUbicacion());
            d.setEstadoConexion(dispositivo.getEstadoConexion());
        }
        return d;
    }

    @Override
    @Transactional
    public boolean deleteDispositivo(Dispositivo dispositivo) {
        if (dispositivo != null && dispositivo.getId() != null) {
            return dispositivoRepository.deleteById(dispositivo.getId());
        }
        return false;
    }
}
