package com.access.control.controller;

import com.access.control.model.AccesoRegistro;
import com.access.control.model.Cliente;
import com.access.control.repository.AccesoRegistroRepository;
import com.access.control.repository.ClienteRepository;
import io.quarkus.cache.CacheResult;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Path("/api/acceso")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AccesoTorniqueteResource {

    @Inject
    ClienteRepository clienteRepo;

    @Inject
    AccesoRegistroRepository accesoRepo;

    @GET
    @Path("/validar/{identificador}")
    public Response validarPasoTorniquete(
            @PathParam("identificador") String identificador,
            @DefaultValue("TORNIQUETE_1") @QueryParam("dispositivo") String dispositivo,
            @DefaultValue("false") @QueryParam("esp32") boolean modoEsp32) {

        long startTime = System.currentTimeMillis();
        ResultadoAccesoDTO resultado = evaluarAccesoEnCache(identificador);
        long latencia = System.currentTimeMillis() - startTime;

        // Auditoria asincrona no bloqueante (Fire-and-forget en WorkerPool)
        Infrastructure.getDefaultExecutor().execute(() -> {
            guardarLogAccesoAsincrono(resultado, identificador, dispositivo, (int) latencia);
        });

        // Formato ultra-compacto si el cliente es un microcontrolador ESP32
        if (modoEsp32) {
            Map<String, Object> espResponse = new HashMap<>();
            espResponse.put("ok", resultado.isAcceso() ? 1 : 0);
            espResponse.put("cli", resultado.getNombreCliente());
            espResponse.put("msg", resultado.getMensaje());
            espResponse.put("rele", resultado.isAcceso() ? 1 : 0);
            espResponse.put("ms", 3000);
            return Response.ok(espResponse).build();
        }

        return Response.ok(resultado).build();
    }

    @CacheResult(cacheName = "acceso-torniquete-cache")
    public ResultadoAccesoDTO evaluarAccesoEnCache(String identificador) {
        Cliente c = clienteRepo.findByIdentificadorRapido(identificador);
        if (c == null) {
            return new ResultadoAccesoDTO(false, "NO_REGISTRADO", "Usuario no registrado en base de datos", "DESCONOCIDO", "SIN_REGISTRO", null);
        }

        String nombreCompleto = (c.getNombre() != null ? c.getNombre() : "") + " " + (c.getApellido() != null ? c.getApellido() : "");
        String estado = c.getEstadoSuscripcion() != null ? c.getEstadoSuscripcion().toUpperCase() : "SIN_MEMBRESIA";

        // Evaluacion de estado de congelamiento
        if (c.getCongeladoHasta() != null && c.getCongeladoHasta().after(new Date())) {
            return new ResultadoAccesoDTO(false, "CONGELADO", "Membresia congelada temporalmente", nombreCompleto, "CONGELADA", null);
        }

        switch (estado) {
            case "ACTIVA":
            case "PAGADO":
                return new ResultadoAccesoDTO(true, "ACCESO_CONCEDIDO", "Bienvenido", nombreCompleto, estado, null);

            case "PENDIENTE_CONCILIAR":
                return new ResultadoAccesoDTO(true, "ACCESO_TEMPORAL", "Bienvenido (Pase de gracia: Pago en revision)", nombreCompleto, estado, "PAGO_PENDIENTE_CONCILIAR");

            case "POR_VENCER":
                return new ResultadoAccesoDTO(true, "ACCESO_CONCEDIDO_AVISO", "Bienvenido (Su cuota vence pronto)", nombreCompleto, estado, "AVISO_POR_VENCER");

            case "VENCIDA":
            case "MOROSO":
                return new ResultadoAccesoDTO(false, "ACCESO_DENEGADO", "Acceso Denegado: Cuota Vencida", nombreCompleto, estado, "MOROSO");

            case "SUSPENDIDA":
                return new ResultadoAccesoDTO(false, "ACCESO_DENEGADO", "Usuario suspendido administrativamente", nombreCompleto, estado, "SUSPENDIDO");

            default:
                return new ResultadoAccesoDTO(false, "ACCESO_DENEGADO", "Sin membresia activa. Regularice en caja", nombreCompleto, estado, "SIN_MEMBRESIA");
        }
    }

    @Transactional
    public void guardarLogAccesoAsincrono(ResultadoAccesoDTO res, String identificador, String dispositivo, int latencia) {
        try {
            AccesoRegistro log = new AccesoRegistro();
            log.setFechaHora(new Date());
            log.setConcedido(res.isAcceso());
            log.setMetodoVerificacion("VALIDACION_RAPIDA_IDENTIFICADOR: " + identificador);
            log.setMotivoDenegacion(res.isAcceso() ? ("Pase Concedido (" + latencia + "ms)") : (res.getMensaje() + " (" + latencia + "ms)"));

            Cliente c = clienteRepo.findByIdentificadorRapido(identificador);
            if (c != null) {
                log.setCliente(c);
            }
            accesoRepo.persist(log);
        } catch (Exception e) {
            // Log silencioso para no degradar el flujo principal
        }
    }

    public static class ResultadoAccesoDTO {
        private boolean acceso;
        private String codigo;
        private String mensaje;
        private String nombreCliente;
        private String estadoMembresia;
        private String alerta;

        public ResultadoAccesoDTO() {}

        public ResultadoAccesoDTO(boolean acceso, String codigo, String mensaje, String nombreCliente, String estadoMembresia, String alerta) {
            this.acceso = acceso;
            this.codigo = codigo;
            this.mensaje = mensaje;
            this.nombreCliente = nombreCliente;
            this.estadoMembresia = estadoMembresia;
            this.alerta = alerta;
        }

        public boolean isAcceso() { return acceso; }
        public void setAcceso(boolean acceso) { this.acceso = acceso; }

        public String getCodigo() { return codigo; }
        public void setCodigo(String codigo) { this.codigo = codigo; }

        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }

        public String getNombreCliente() { return nombreCliente; }
        public void setNombreCliente(String nombreCliente) { this.nombreCliente = nombreCliente; }

        public String getEstadoMembresia() { return estadoMembresia; }
        public void setEstadoMembresia(String estadoMembresia) { this.estadoMembresia = estadoMembresia; }

        public String getAlerta() { return alerta; }
        public void setAlerta(String alerta) { this.alerta = alerta; }
    }
}
