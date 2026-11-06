package com.access.control.graphql;

import com.access.control.model.Cliente;
import com.access.control.model.Empleado;
import com.access.control.model.Piso;
import com.access.control.model.SignosVitales;
import com.access.control.model.AccesoRegistro;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.EmpleadoRepository;
import com.access.control.repository.PisoRepository;
import com.access.control.repository.SignosVitalesRepository;
import com.access.control.repository.AccesoRegistroRepository;
import jakarta.inject.Inject;
import org.eclipse.microprofile.graphql.GraphQLApi;
import org.eclipse.microprofile.graphql.Name;
import org.eclipse.microprofile.graphql.Query;
import org.eclipse.microprofile.graphql.Description;
import org.eclipse.microprofile.jwt.JsonWebToken;
import java.util.List;

@GraphQLApi
public class ControlAccesoGraphQLApi {

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    EmpleadoRepository empleadoRepository;

    @Inject
    PisoRepository pisoRepository;

    @Inject
    SignosVitalesRepository signosVitalesRepository;

    @Inject
    AccesoRegistroRepository accesoRegistroRepository;

    @Inject
    JsonWebToken jwt;

    public static class ClienteDetallePayload {
        public Cliente cliente;
        public SignosVitales ultimoSignoVital;
        public List<AccesoRegistro> ultimosAccesos;
    }

    public static class EmpleadoDetallePayload {
        public Empleado empleado;
        public List<AccesoRegistro> asistenciasRecientes;
    }

    private void validarAccesoCliente(Long targetClienteId) {
        if (jwt == null || jwt.getName() == null || jwt.getName().isBlank()) {
            throw new SecurityException("No autenticado");
        }
        java.util.Set<String> groups = jwt.getGroups();
        boolean isPrivileged = false;
        if (groups != null) {
            for (String g : groups) {
                if (g != null) {
                    String up = g.toUpperCase();
                    if (up.contains("ADMIN") || up.contains("CONTABLE") || up.contains("ANALISTA") || up.contains("RECEPCION") || up.contains("OPERACION")) {
                        isPrivileged = true;
                        break;
                    }
                }
            }
        }
        if (!isPrivileged) {
            Long callerCid = null;
            Object cClaim = jwt.getClaim("clienteId");
            if (cClaim instanceof Number) {
                callerCid = ((Number) cClaim).longValue();
            }
            if (callerCid == null || callerCid <= 0) {
                Cliente c = clienteRepository.findByEmail(jwt.getName().trim().toLowerCase());
                if (c != null) callerCid = c.getId();
            }
            if (callerCid == null || !callerCid.equals(targetClienteId)) {
                throw new SecurityException("Acceso denegado: No puede consultar datos de otro cliente");
            }
        }
    }

    private void validarAccesoStaff() {
        if (jwt == null || jwt.getName() == null || jwt.getName().isBlank()) {
            throw new SecurityException("No autenticado");
        }
        java.util.Set<String> groups = jwt.getGroups();
        boolean isPrivileged = false;
        if (groups != null) {
            for (String g : groups) {
                if (g != null) {
                    String up = g.toUpperCase();
                    if (up.contains("ADMIN") || up.contains("CONTABLE") || up.contains("ANALISTA") || up.contains("RECEPCION") || up.contains("OPERACION") || up.contains("SEGURIDAD")) {
                        isPrivileged = true;
                        break;
                    }
                }
            }
        }
        if (!isPrivileged) {
            throw new SecurityException("Acceso denegado: Consulta reservada a personal de la instalacion");
        }
    }

    @Query("clienteDetalleCompleto")
    @Description("Obtiene perfil completo de cliente con sus signos vitales y accesos en una sola consulta optimizada")
    public ClienteDetallePayload getClienteDetalleCompleto(@Name("clienteId") Long clienteId) {
        validarAccesoCliente(clienteId);
        ClienteDetallePayload payload = new ClienteDetallePayload();
        payload.cliente = clienteRepository.findById(clienteId);
        if (payload.cliente != null) {
            payload.ultimoSignoVital = signosVitalesRepository.findUltimoPorCliente(clienteId);
            payload.ultimosAccesos = accesoRegistroRepository.findRecientes();
        }
        return payload;
    }

    @Query("empleadoDetalleCompleto")
    @Description("Obtiene perfil completo de empleado y sus registros de jornada")
    public EmpleadoDetallePayload getEmpleadoDetalleCompleto(@Name("empleadoId") Long empleadoId) {
        validarAccesoStaff();
        EmpleadoDetallePayload payload = new EmpleadoDetallePayload();
        payload.empleado = empleadoRepository.findById(empleadoId);
        if (payload.empleado != null) {
            payload.asistenciasRecientes = accesoRegistroRepository.findRecientes();
        }
        return payload;
    }

    @Query("pisosConDispositivos")
    @Description("Obtiene listado de todos los pisos de la instalacion")
    public List<Piso> getPisosConDispositivos() {
        validarAccesoStaff();
        return pisoRepository.listAll();
    }
}
