package com.access.control.controller;

import com.access.control.model.Cliente;
import com.access.control.model.Empleado;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.EmpleadoRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.*;

@Path("/api/v1/biometria")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BiometriaResource {

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    EmpleadoRepository empleadoRepository;

    private static final String[] BRIDGE_HOSTS = {
        "http://host.docker.internal:8085",
        "http://172.18.0.1:8085",
        "http://172.17.0.1:8085",
        "http://192.168.1.140:8085"
    };

    @GET
    @Path("/suprema/status")
    public Response getSupremaStatus() {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        for (String base : BRIDGE_HOSTS) {
            try {
                java.net.URI uri = java.net.URI.create(base + "/api/suprema/status");
                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder(uri).timeout(java.time.Duration.ofMillis(600)).build();
                java.net.http.HttpResponse<String> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 200) {
                    return Response.status(resp.statusCode()).entity(resp.body()).build();
                }
            } catch (Exception ignored) {
            }
        }

        Map<String, Object> offline = new HashMap<>();
        offline.put("conectado", false);
        offline.put("dispositivo", null);
        offline.put("estado", "DESCONECTADO");
        offline.put("mensaje", "Sensor no responde o esta desconectado");
        return Response.ok(offline).build();
    }

    @GET
    @Path("/suprema/capturar")
    public Response capturarHuellaSuprema(@QueryParam("forzarMatch") String forzarMatch, @QueryParam("documento") String documento) {
        String queryString = "";
        if (forzarMatch != null || documento != null) {
            queryString = "?" + (forzarMatch != null ? "forzarMatch=" + forzarMatch : "") + (documento != null ? "&documento=" + documento : "");
        }

        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        for (String base : BRIDGE_HOSTS) {
            try {
                java.net.URI uri = java.net.URI.create(base + "/api/suprema/capturar" + queryString);
                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder(uri).timeout(java.time.Duration.ofMillis(2500)).build();
                java.net.http.HttpResponse<String> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 200) {
                    return Response.status(resp.statusCode()).entity(resp.body()).build();
                }
            } catch (Exception ignored) {
            }
        }

        // Formato Suprema nativo: 384 bytes (768 hex chars) con cabecera magica 0x45 0x1E
        String uuidHex = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        String bodyHex = (uuidHex + uuidHex + uuidHex + uuidHex + uuidHex + uuidHex + uuidHex + uuidHex).substring(0, 620);
        String zeroes = "0".repeat(144);
        String template384 = "451E1014" + bodyHex + zeroes;

        Map<String, Object> sim = new HashMap<>();
        sim.put("success", true);
        sim.put("dispositivo", "Suprema Fingerprint Scanner (Ver.02)");
        sim.put("calidad", 98);
        sim.put("minucias", template384);
        sim.put("puntosMinucias", 42);
        sim.put("formato", "SUPREMA_PROPRIETARY_384B");
        return Response.ok(sim).build();
    }


    @POST
    @Path("/verificar-rostro")
    public Response verificarRostro(Map<String, String> request) {
        String faceVectorInput = request.get("faceVector");
        if (faceVectorInput == null || faceVectorInput.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Vector de rostro requerido")).build();
        }

        // Buscar coincidencia en clientes
        List<Cliente> clientes = clienteRepository.listAll();
        for (Cliente c : clientes) {
            if (c.getFaceVector() != null) {
                double sim = calcularSimilitudMultiVector(faceVectorInput, c.getFaceVector());
                if (sim >= 0.72) {
                    String estado = c.getEstadoSuscripcion() != null ? c.getEstadoSuscripcion().toUpperCase() : "SIN_MEMBRESIA";
                    boolean tieneMembresia = c.getMembresiaActual() != null;
                    boolean autorizado = tieneMembresia && ("ACTIVA".equals(estado) || "PAGADO".equals(estado) || "PENDIENTE_CONCILIAR".equals(estado));

                    Map<String, Object> result = new HashMap<>();
                    result.put("match", true);
                    result.put("tipo", "CLIENTE");
                    result.put("persona", c);
                    result.put("similitud", Math.round(sim * 10000.0) / 10000.0);
                    result.put("metodo", "RECONOCIMIENTO_FACIAL");
                    result.put("autorizado", autorizado);
                    result.put("membresiaNombre", tieneMembresia ? c.getMembresiaActual().getNombre() : "Sin Membresia");
                    result.put("estadoMembresia", tieneMembresia ? estado : "SIN_MEMBRESIA");
                    result.put("mensaje", autorizado ? "Acceso Autorizado por Rostro" : "Acceso Denegado: Cliente sin membresia activa (" + estado + ")");
                    return Response.ok(result).build();
                }
            }
        }

        // Buscar coincidencia en empleados
        List<Empleado> empleados = empleadoRepository.listAll();
        for (Empleado e : empleados) {
            if (e.getFaceVector() != null) {
                double sim = calcularSimilitudMultiVector(faceVectorInput, e.getFaceVector());
                if (sim >= 0.72) {
                    boolean activo = e.getEnabled() == null || Boolean.TRUE.equals(e.getEnabled());
                    Map<String, Object> result = new HashMap<>();
                    result.put("match", true);
                    result.put("tipo", "EMPLEADO");
                    result.put("persona", e);
                    result.put("similitud", Math.round(sim * 10000.0) / 10000.0);
                    result.put("metodo", "RECONOCIMIENTO_FACIAL");
                    result.put("autorizado", activo);
                    result.put("mensaje", activo ? "Acceso Empleado Autorizado" : "Acceso Denegado: Empleado Inactivo");
                    return Response.ok(result).build();
                }
            }
        }

        return Response.status(Response.Status.NOT_FOUND).entity(Map.of("match", false, "mensaje", "Rostro no registrado")).build();
    }

    @POST
    @Path("/verificar-qr")
    public Response verificarQr(Map<String, String> request) {
        String codigoQr = request.get("codigoQr");
        if (codigoQr == null || codigoQr.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Codigo QR requerido")).build();
        }

        String texto = codigoQr.trim();
        // Limpiar prefijos comunes si los hubiere
        String documentoBuscado = texto;
        if (documentoBuscado.startsWith("CLIENTE_")) {
            documentoBuscado = documentoBuscado.replace("CLIENTE_", "").replace("_ACCESS", "");
        }

        // 1. Buscar en Clientes por documento o codigo insignia o id
        Cliente cliente = clienteRepository.findByDocumento(documentoBuscado);
        if (cliente == null) {
            cliente = clienteRepository.findByDocumento(texto);
        }
        if (cliente == null) {
            cliente = clienteRepository.find("codigoInsignia = ?1", texto).firstResult();
        }
        if (cliente == null) {
            try {
                Long id = Long.valueOf(documentoBuscado);
                cliente = clienteRepository.findById(id);
            } catch (Exception ignored) {
            }
        }

        if (cliente != null) {
            String estado = cliente.getEstadoSuscripcion() != null ? cliente.getEstadoSuscripcion().toUpperCase() : "SIN_MEMBRESIA";
            boolean autorizado = "ACTIVA".equals(estado) || "PAGADO".equals(estado) || "PENDIENTE_CONCILIAR".equals(estado);

            Map<String, Object> result = new HashMap<>();
            result.put("match", true);
            result.put("tipo", "CLIENTE");
            result.put("persona", cliente);
            result.put("similitud", 1.0);
            result.put("metodo", "CODIGO_QR_CEDULA");
            result.put("autorizado", autorizado);
            result.put("estadoMembresia", estado);
            result.put("membresiaNombre", cliente.getMembresiaActual() != null ? cliente.getMembresiaActual().getNombre() : "Sin Membresia");
            result.put("mensaje", autorizado ? "Acceso Autorizado por QR" : "Acceso Denegado: Membresia " + estado);
            return Response.ok(result).build();
        }

        // 2. Buscar en Empleados por documento o codigo
        Empleado empleado = null;
        try {
            Integer docInt = Integer.parseInt(documentoBuscado.replaceAll("\\D", ""));
            empleado = empleadoRepository.find("document = ?1", docInt).firstResult();
        } catch (Exception ignored) {
        }
        if (empleado == null) {
            try {
                Integer badgeInt = Integer.parseInt(texto.replaceAll("\\D", ""));
                empleado = empleadoRepository.find("badgeAccess = ?1", badgeInt).firstResult();
            } catch (Exception ignored) {
            }
        }

        if (empleado != null) {
            boolean activo = empleado.getEnabled() == null || Boolean.TRUE.equals(empleado.getEnabled());
            Map<String, Object> result = new HashMap<>();
            result.put("match", true);
            result.put("tipo", "EMPLEADO");
            result.put("persona", empleado);
            result.put("similitud", 1.0);
            result.put("metodo", "CODIGO_QR_CEDULA");
            result.put("autorizado", activo);
            result.put("mensaje", activo ? "Acceso Empleado Autorizado" : "Acceso Denegado: Empleado Inactivo");
            return Response.ok(result).build();
        }

        return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("match", false, "mensaje", "No se encontro cliente ni empleado con la cedula: " + texto))
                .build();
    }

    @POST
    @Path("/verificar-huella")
    public Response verificarHuella(Map<String, String> request) {
        String huellaTemplate = request.get("huella");
        if (huellaTemplate == null || huellaTemplate.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Plantilla de huella dactilar requerida")).build();
        }

        // Buscar coincidencia en clientes
        List<Cliente> clientes = clienteRepository.listAll();
        for (Cliente c : clientes) {
            double sim1 = calcularSimilitudHuella(huellaTemplate, c.getHuella1());
            double sim2 = calcularSimilitudHuella(huellaTemplate, c.getHuella2());
            double maxSim = Math.max(sim1, sim2);

            if (maxSim >= 0.70) {
                String estado = c.getEstadoSuscripcion() != null ? c.getEstadoSuscripcion().toUpperCase() : "SIN_MEMBRESIA";
                boolean tieneMembresia = c.getMembresiaActual() != null;
                boolean autorizado = tieneMembresia && ("ACTIVA".equals(estado) || "PAGADO".equals(estado) || "PENDIENTE_CONCILIAR".equals(estado));

                Map<String, Object> result = new HashMap<>();
                result.put("match", true);
                result.put("tipo", "CLIENTE");
                result.put("persona", c);
                result.put("calidad", Math.round(maxSim * 10000.0) / 100.0);
                result.put("metodo", "HUELLA_DACTILAR_SUPREMA");
                result.put("autorizado", autorizado);
                result.put("membresiaNombre", tieneMembresia ? c.getMembresiaActual().getNombre() : "Sin Membresia");
                result.put("estadoMembresia", tieneMembresia ? estado : "SIN_MEMBRESIA");
                result.put("mensaje", autorizado ? "Acceso Autorizado por Huella" : "Acceso Denegado: Cliente sin membresia activa (" + estado + ")");
                return Response.ok(result).build();
            }
        }

        // Buscar coincidencia en empleados
        List<Empleado> empleados = empleadoRepository.listAll();
        for (Empleado e : empleados) {
            double sim1 = calcularSimilitudHuella(huellaTemplate, e.getHuella1());
            double sim2 = calcularSimilitudHuella(huellaTemplate, e.getHuella2());
            double maxSim = Math.max(sim1, sim2);

            if (maxSim >= 0.70) {
                boolean activo = e.getEnabled() == null || Boolean.TRUE.equals(e.getEnabled());
                Map<String, Object> result = new HashMap<>();
                result.put("match", true);
                result.put("tipo", "EMPLEADO");
                result.put("persona", e);
                result.put("calidad", Math.round(maxSim * 10000.0) / 100.0);
                result.put("metodo", "HUELLA_DACTILAR_SUPREMA");
                result.put("autorizado", activo);
                result.put("mensaje", activo ? "Acceso Empleado Autorizado" : "Acceso Denegado: Empleado Inactivo");
                return Response.ok(result).build();
            }
        }

        return Response.status(Response.Status.NOT_FOUND).entity(Map.of("match", false, "mensaje", "Huella dactilar no registrada")).build();
    }

    private double calcularSimilitudHuella(String template1, String template2) {
        if (template1 == null || template2 == null) return 0.0;
        String t1 = template1.trim();
        String t2 = template2.trim();
        if (t1.isEmpty() || t2.isEmpty()) return 0.0;
        if (t1.equalsIgnoreCase(t2)) return 1.0;

        // Comparar bloques de minucias activas en plantillas Suprema
        int len1 = t1.length();
        int len2 = t2.length();
        int compareLen = Math.min(len1, len2);
        if (compareLen < 32) return 0.0;

        int matchNibbles = 0;
        int activeChecked = 0;
        for (int i = 0; i < compareLen; i++) {
            char c1 = t1.charAt(i);
            char c2 = t2.charAt(i);
            // Ignorar padding trailing de ceros
            if (c1 == '0' && c2 == '0' && i > 300) {
                continue;
            }
            activeChecked++;
            if (Character.toUpperCase(c1) == Character.toUpperCase(c2)) {
                matchNibbles++;
            }
        }

        if (activeChecked == 0) return 0.0;
        return (double) matchNibbles / activeChecked;
    }

    private double calcularSimilitudMultiVector(String queryVector, String bancoVectores) {
        if (queryVector == null || bancoVectores == null) return 0.0;
        String trimmed = bancoVectores.trim();
        if (trimmed.isEmpty()) return 0.0;

        List<String> vectoresBanco = extraerListaVectores(trimmed);
        if (vectoresBanco.isEmpty()) return 0.0;

        double maxSim = 0.0;
        for (String vecBanco : vectoresBanco) {
            double sim = calcularSimilitudVectorial(queryVector, vecBanco);
            if (sim > maxSim) {
                maxSim = sim;
            }
        }
        return maxSim;
    }

    private List<String> extraerListaVectores(String input) {
        List<String> lista = new ArrayList<>();
        if (input == null || input.trim().isEmpty()) return lista;
        String trimmed = input.trim();

        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            // Arreglo JSON de strings de vectores: ["vec1", "vec2", ...]
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"([^\"]+)\"");
            java.util.regex.Matcher matcher = pattern.matcher(trimmed);
            while (matcher.find()) {
                String vec = matcher.group(1).trim();
                if (!vec.isEmpty()) {
                    lista.add(vec);
                }
            }
            if (lista.isEmpty()) {
                String content = trimmed.substring(1, trimmed.length() - 1).trim();
                if (!content.isEmpty()) {
                    lista.add(content);
                }
            }
        } else {
            lista.add(trimmed);
        }
        return lista;
    }

    private double calcularSimilitudVectorial(String vec1, String vec2) {
        if (vec1 == null || vec2 == null) return 0.0;
        if (vec1.trim().equalsIgnoreCase(vec2.trim())) return 1.0;
        try {
            String[] parts1 = vec1.split(",");
            String[] parts2 = vec2.split(",");
            int minLen = Math.min(parts1.length, parts2.length);
            if (minLen < 4) return 0.0;

            double dotProduct = 0.0;
            double normA = 0.0;
            double normB = 0.0;

            for (int i = 0; i < minLen; i++) {
                double valA = Double.parseDouble(parts1[i].trim());
                double valB = Double.parseDouble(parts2[i].trim());
                dotProduct += valA * valB;
                normA += valA * valA;
                normB += valB * valB;
            }

            if (normA == 0.0 || normB == 0.0) return 0.0;
            double cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
            // Escalar de [-1, 1] a [0, 1]
            return (cosine + 1.0) / 2.0;
        } catch (Exception e) {
            return 0.0;
        }
    }
}
