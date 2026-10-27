package com.access.control.services;

import com.access.control.model.TipoContrato;
import java.util.List;

public interface TipoContratoService {
    TipoContrato getTipoContratoById(Long id);
    List<TipoContrato> getListTipoContratos();
    TipoContrato addTipoContrato(TipoContrato tipoContrato);
    TipoContrato updateTipoContrato(TipoContrato tipoContrato, Long id);
    boolean deleteTipoContrato(TipoContrato tipoContrato);
}
