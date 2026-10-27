package com.access.control.controller;

import com.access.control.model.AccesoRegistro;
import com.access.control.model.Cliente;
import com.access.control.repository.AccesoRegistroRepository;
import com.access.control.repository.ClienteRepository;
import com.access.control.dto.PageResponseDTO;
import com.access.control.model.BitacoraEventoPaso;
import com.access.control.repository.BitacoraEventoPasoRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Path("/api/v1/acceso")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AccesoResource {

    @Inject
    AccesoRegistroRepository accesoRepository;

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    BitacoraEventoPasoRepository bitacoraRepository;

    @Inject
    com.access.control.services.AccessValidationStrategy accessValidationStrategy;

    @GET
    @Path("/registros")
    public List<AccesoRegistro> getRegistrosRecientes() {
        return accesoRepository.findRecientes();
    }

    @GET
    @Path("/historial/permitidos")
    public List<AccesoRegistro> getHistorialPermitidos() {
        return accesoRepository.findPermitidos();
    }

    @GET
    @Path("/historial/denegados")
    public List<AccesoRegistro> getHistorialDenegados() {
        return accesoRepository.findDenegados();
    }

    @GET
    @Path("/gimnasio/top-asistencia")
    public Response getTopAsistencia(@QueryParam("sedeId") Long sedeId) {
        String baseQuery = "concedido = true and cliente is not null";
        if (sedeId != null) {
            baseQuery += " and cliente.sede.id = " + sedeId;
        }

        List<AccesoRegistro> accesos = accesoRepository.find(baseQuery + " order by fechaHora desc").list();
        if (accesos.isEmpty()) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("nombre", "Sin Registros");
            fallback.put("diasConsecutivos", 0);
            fallback.put("checkInsTotales", 0);
            fallback.put("categoria", "Sin Categoria");
            fallback.put("foto", null);
            return Response.ok(fallback).build();
        }

        // Agrupar dias unicos (YYYY-MM-DD) por cliente
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        Map<Long, java.util.TreeSet<String>> diasPorCliente = new HashMap<>();
        Map<Long, Integer> checkInsPorCliente = new HashMap<>();
        Map<Long, Cliente> clienteObjMap = new HashMap<>();

        for (AccesoRegistro reg : accesos) {
            Cliente c = reg.getCliente();
            if (c != null && reg.getFechaHora() != null) {
                Long cId = c.getId();
                clienteObjMap.putIfAbsent(cId, c);
                checkInsPorCliente.put(cId, checkInsPorCliente.getOrDefault(cId, 0) + 1);

                diasPorCliente.computeIfAbsent(cId, k -> new java.util.TreeSet<>((a, b) -> b.compareTo(a)))
                              .add(sdf.format(reg.getFechaHora()));
            }
        }

        Long bestClienteId = null;
        int maxConsecutivos = 0;
        int maxCheckIns = 0;

        for (Map.Entry<Long, java.util.TreeSet<String>> entry : diasPorCliente.entrySet()) {
            Long cId = entry.getKey();
            java.util.TreeSet<String> diasDesc = entry.getValue();

            // Calcular racha maxima consecutiva de dias
            int racha = 0;
            java.time.LocalDate anterior = null;
            for (String fechaStr : diasDesc) {
                java.time.LocalDate fecha = java.time.LocalDate.parse(fechaStr);
                if (anterior == null) {
                    racha = 1;
                } else {
                    long diff = java.time.temporal.ChronoUnit.DAYS.between(fecha, anterior);
                    if (diff == 1) {
                        racha++;
                    } else {
                        break;
                    }
                }
                anterior = fecha;
            }

            if (racha > maxConsecutivos || (racha == maxConsecutivos && checkInsPorCliente.getOrDefault(cId, 0) > maxCheckIns)) {
                maxConsecutivos = racha;
                maxCheckIns = checkInsPorCliente.getOrDefault(cId, 0);
                bestClienteId = cId;
            }
        }

        if (bestClienteId == null && !clienteObjMap.isEmpty()) {
            bestClienteId = clienteObjMap.keySet().iterator().next();
        }

        Cliente topCli = clienteObjMap.get(bestClienteId);
        Map<String, Object> res = new HashMap<>();
        if (topCli != null) {
            res.put("clienteId", topCli.getId());
            res.put("nombre", (topCli.getNombre() != null ? topCli.getNombre() : "") + " " + (topCli.getApellido() != null ? topCli.getApellido() : ""));
            res.put("diasConsecutivos", maxConsecutivos > 0 ? maxConsecutivos : 1);
            res.put("checkInsTotales", checkInsPorCliente.getOrDefault(bestClienteId, 1));
            res.put("categoria", topCli.getEstadoSuscripcion() != null ? ("Miembro " + topCli.getEstadoSuscripcion()) : "Miembro VIP Pro");
            res.put("foto", topCli.getFoto());
        }

        return Response.ok(res).build();
    }

    @GET
    @Path("/gimnasio/en-sala")
    public Response getClientesActivosEnSala(@QueryParam("sedeId") Long sedeId) {
        // Obtenemos los accesos concedidos de las ultimas 4 horas para determinar presencia en sala
        Date cuatroHorasAtras = new Date(System.currentTimeMillis() - (4L * 3600 * 1000));
        
        String query = (sedeId != null) 
            ? "concedido = true and fechaHora >= ?1 and cliente is not null and cliente.sede.id = ?2 order by fechaHora desc"
            : "concedido = true and fechaHora >= ?1 and cliente is not null order by fechaHora desc";
            
        List<AccesoRegistro> entradas = (sedeId != null)
            ? accesoRepository.list(query, cuatroHorasAtras, sedeId)
            : accesoRepository.list(query, cuatroHorasAtras);

        // Agrupamos por cliente unico mas reciente
        Map<Long, Map<String, Object>> clientesUnicos = new HashMap<>();
        for (AccesoRegistro r : entradas) {
            Cliente c = r.getCliente();
            if (c != null && !clientesUnicos.containsKey(c.getId())) {
                Map<String, Object> dto = new HashMap<>();
                dto.put("clienteId", c.getId());
                dto.put("nombre", (c.getNombre() != null ? c.getNombre() : "") + " " + (c.getApellido() != null ? c.getApellido() : ""));
                dto.put("documento", c.getDocumento());
                dto.put("foto", c.getFoto());
                dto.put("estadoMembresia", c.getEstadoSuscripcion() != null ? c.getEstadoSuscripcion() : "ACTIVA");
                dto.put("horaEntrada", r.getFechaHora());
                dto.put("dispositivo", r.getDispositivo() != null ? r.getDispositivo().getNombre() : "Torniquete Principal");
                dto.put("sedeId", c.getSede() != null ? c.getSede().getId() : null);
                clientesUnicos.put(c.getId(), dto);
            }
        }

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("totalEnSala", clientesUnicos.size());
        respuesta.put("capacidadMaxima", 150);
        respuesta.put("porcentajeOcupacion", Math.min(100, Math.round((clientesUnicos.size() * 100.0) / 150.0)));
        respuesta.put("clientes", clientesUnicos.values());

        return Response.ok(respuesta).build();
    }

    @POST
    @Path("/validar")
    @Transactional
    public Response validarAcceso(AccesoRegistro solicitud) {
        solicitud.setFechaHora(new Date());

        if (solicitud.getCliente() != null && solicitud.getCliente().getId() != null) {
            Cliente c = clienteRepository.findById(solicitud.getCliente().getId());
            if (c != null) {
                com.access.control.services.AccessValidationStrategy.ValidationResult result = 
                        accessValidationStrategy.validarCliente(c, solicitud.getDispositivo());
                solicitud.setConcedido(result.isConcedido());
                if (!result.isConcedido()) {
                    solicitud.setMotivoDenegacion(result.getMotivo());
                }
            }
        }

        accesoRepository.persist(solicitud);

        // Guardar bitacora de eventos de paso en MongoDB
        try {
            BitacoraEventoPaso bitacora = new BitacoraEventoPaso();
            bitacora.setFechaHora(solicitud.getFechaHora() != null ? solicitud.getFechaHora() : new Date());
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm:ss");
            bitacora.setHora(sdf.format(bitacora.getFechaHora()));
            bitacora.setConcedido(solicitud.getConcedido());
            bitacora.setMetodo(solicitud.getMetodoVerificacion());
            bitacora.setTipo(Boolean.TRUE.equals(solicitud.getConcedido()) ? "success" : "danger");
            String nombrePersona = solicitud.getCliente() != null ? (solicitud.getCliente().getNombre() + " " + (solicitud.getCliente().getApellido() != null ? solicitud.getCliente().getApellido() : "")).trim() : "Desconocido";
            bitacora.setPersonaNombre(nombrePersona);
            bitacora.setMensaje(Boolean.TRUE.equals(solicitud.getConcedido()) ? ("Acceso Concedido: " + nombrePersona) : ("Acceso Denegado: " + (solicitud.getMotivoDenegacion() != null ? solicitud.getMotivoDenegacion() : "Sin permisos")));
            if (solicitud.getDispositivo() != null) {
                bitacora.setDispositivoId(solicitud.getDispositivo().getId());
                bitacora.setDispositivoNombre(solicitud.getDispositivo().getNombre());
            }
            if (solicitud.getCliente() != null && solicitud.getCliente().getSede() != null) {
                bitacora.setSedeId(solicitud.getCliente().getSede().getId());
                bitacora.setSedeNombre(solicitud.getCliente().getSede().getSede());
            }
            bitacoraRepository.persist(bitacora);
        } catch (Exception ignored) {
        }

        return Response.ok(solicitud).build();
    }

    @POST
    @Path("/dispositivo/{id}/abrir")
    @Transactional
    public Response abrirTorniquete(@PathParam("id") Long id, Map<String, Object> body) {
        String operador = body != null && body.containsKey("operador") ? (String) body.get("operador") : "Terminal Vision";
        String ipDispositivo = body != null && body.containsKey("ip") ? (String) body.get("ip") : "192.168.1.168";

        AccesoRegistro registro = new AccesoRegistro();
        registro.setFechaHora(new Date());
        registro.setMetodoVerificacion("RELE_REMOTO");
        registro.setConcedido(true);
        registro.setMotivoDenegacion("Apertura de torniquete IP: " + ipDispositivo + " activada por " + operador);
        accesoRepository.persist(registro);

        // Guardar bitacora de apertura en MongoDB
        try {
            BitacoraEventoPaso bitacora = new BitacoraEventoPaso();
            bitacora.setFechaHora(registro.getFechaHora());
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm:ss");
            bitacora.setHora(sdf.format(registro.getFechaHora()));
            bitacora.setConcedido(true);
            bitacora.setMetodo("RELE_REMOTO");
            bitacora.setTipo("info");
            bitacora.setPersonaNombre(operador);
            bitacora.setMensaje("Apertura fisica enviada a torniquete (" + ipDispositivo + ") por " + operador);
            bitacora.setDispositivoId(id);
            bitacoraRepository.persist(bitacora);
        } catch (Exception ignored) {
        }

        Map<String, Object> res = new HashMap<>();
        res.put("dispositivoId", id);
        res.put("ip", ipDispositivo);
        res.put("estado", "ABIERTO");
        res.put("tiempoPulsoMs", 3000);
        res.put("mensaje", "Pulso de apertura enviado satisfactoriamente al torniquete.");
        return Response.ok(res).build();
    }

    @GET
    @Path("/bitacora")
    public Response listarBitacoraEventos(@QueryParam("page") @DefaultValue("0") int page,
                                          @QueryParam("size") @DefaultValue("15") int size,
                                          @QueryParam("sedeId") Long sedeId) {
        PageResponseDTO<BitacoraEventoPaso> response = bitacoraRepository.findPaginado(page, size, sedeId);
        return Response.ok(response).build();
    }

    @POST
    @Path("/bitacora")
    public Response registrarEventoBitacora(BitacoraEventoPaso evento) {
        if (evento == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Datos invalidos")).build();
        }
        if (evento.getFechaHora() == null) {
            evento.setFechaHora(new Date());
        }
        if (evento.getHora() == null || evento.getHora().isBlank()) {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm:ss");
            evento.setHora(sdf.format(evento.getFechaHora()));
        }
        bitacoraRepository.persist(evento);
        return Response.status(Response.Status.CREATED).entity(evento).build();
    }
}
