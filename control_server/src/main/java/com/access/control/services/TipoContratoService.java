package com.access.control.services;

import com.access.control.model.TipoContrato;

import java.util.List;
import java.util.Optional;

public interface TipoContratoService {
    List<TipoContrato> getListTipoContratos(Object... params);
    TipoContrato getTipoContrato(TipoContrato params);
    Optional<TipoContrato> findById(Long id);
    TipoContrato getTipoContratoById(Long id);
    TipoContrato addTipoContrato(TipoContrato obj);
    TipoContrato updateTipoContrato(TipoContrato obj, Long id);
    Boolean deleteTipoContrato(TipoContrato obj);
}
