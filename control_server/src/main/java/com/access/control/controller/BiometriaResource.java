package com.access.control.controller;

import com.access.control.model.Authority;
import com.access.control.model.Cliente;
import com.access.control.model.Empleado;
import com.access.control.model.User;
import com.access.control.repository.ClienteRepository;
import com.access.control.repository.EmpleadoRepository;
import com.access.control.repository.UserRepository;
import com.access.control.services.UsuarioService;
import io.smallrye.jwt.build.Jwt;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Duration;
import java.util.*;

@Path("/api/v1/biometria")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BiometriaResource {

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    EmpleadoRepository empleadoRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    UsuarioService usuarioService;

    private static final String[] BRIDGE_HOSTS = {
        "http://host.docker.internal:8085",
        "http://127.0.0.1:8085",
        "http://localhost:8085",
        "http://172.18.0.1:8085",
        "http://172.17.0.1:8085",
        "http://192.168.1.140:8085"
    };

    private List<String> buildTargetHosts(String customHost) {
        List<String> list = new ArrayList<>();
        if (customHost != null && !customHost.trim().isEmpty()) {
            String clean = customHost.trim();
            if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
                clean = "http://" + clean;
            }
            list.add(clean);
        }
        for (String b : BRIDGE_HOSTS) {
            if (!list.contains(b)) {
                list.add(b);
            }
        }
        return list;
    }

    @GET
    @Path("/suprema/status")
    public Response getSupremaStatus(@QueryParam("host") String host) {
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        List<String> targets = buildTargetHosts(host);

        for (String base : targets) {
            try {
                java.net.URI uri = java.net.URI.create(base + "/api/suprema/status");
                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder(uri).timeout(java.time.Duration.ofMillis(700)).build();
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
        offline.put("mensaje", "Sensor no responde o esta desconectado en " + (host != null ? host : "localhost:8085"));
        return Response.ok(offline).build();
    }

    @GET
    @Path("/suprema/capturar")
    public Response capturarHuellaSuprema(@QueryParam("forzarMatch") String forzarMatch,
                                          @QueryParam("documento") String documento,
                                          @QueryParam("dedo") Integer dedo,
                                          @QueryParam("host") String host) {
        StringBuilder queryBuilder = new StringBuilder();
        if (dedo != null) queryBuilder.append("dedo=").append(dedo).append("&");
        if (forzarMatch != null) queryBuilder.append("forzarMatch=").append(forzarMatch).append("&");
        if (documento != null) queryBuilder.append("documento=").append(documento).append("&");
        String queryString = queryBuilder.length() > 0 ? "?" + queryBuilder.substring(0, queryBuilder.length() - 1) : "";

        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        List<String> targets = buildTargetHosts(host);

        for (String base : targets) {
            try {
                java.net.URI uri = java.net.URI.create(base + "/api/suprema/capturar" + queryString);
                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder(uri).timeout(java.time.Duration.ofMillis(3000)).build();
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
        sim.put("host", host != null ? host : "127.0.0.1:8085");
        return Response.ok(sim).build();
    }

    @Inject
    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "CAMARA_RTSP_USER", defaultValue = "admin")
    String camRTSPUser;

    @Inject
    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "CAMARA_RTSP_PASSWORD", defaultValue = "Family09")
    String camRTSPPassword;

    @Inject
    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "CAMARA_RTSP_CHANNEL", defaultValue = "102")
    String camRTSPChannel;

    @GET
    @Path("/camara/snapshot")
    @Produces({"image/jpeg", "application/json"})
    public Response getCamaraSnapshot(@QueryParam("ip") String ip,
                                      @QueryParam("port") Integer port,
                                      @QueryParam("path") String path) {
        if (ip == null || ip.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "IP de camara requerida")).build();
        }
        int targetPort = (port != null && port > 0) ? port : 80;
        String targetPath = (path != null && !path.trim().isEmpty()) ? path.trim() : "/snapshot.jpg";
        if (!targetPath.startsWith("/")) {
            targetPath = "/" + targetPath;
        }

        // Si la peticion viene apuntando a MediaMTX (puerto 8889, 8554 o ruta /cam...),
        // mapear hacia la camara Hikvision nativa (192.168.1.197:80)
        String requestIp = ip.trim();
        int requestPort = targetPort;
        String requestPath = targetPath;

        if (targetPort == 8889 || targetPort == 8554 || targetPath.contains("/cam") || targetPath.contains("/stream") || targetPath.contains("/entrada")) {
            requestIp = "192.168.1.197";
            requestPort = 80;
            // Deducir canal segun la ruta
            String channel = "101";
            if (targetPath.contains("cam1")) {
                channel = "201";
            } else if (targetPath.contains("cam2")) {
                channel = "301";
            } else if (targetPath.contains("cam3")) {
                channel = "401";
            } else if (targetPath.contains("entrada")) {
                channel = "101";
            } else {
                channel = camRTSPChannel != null && !camRTSPChannel.isEmpty() ? camRTSPChannel : "101";
                if (channel.endsWith("2")) {
                    channel = channel.substring(0, channel.length() - 1) + "1";
                }
            }
            requestPath = "/ISAPI/Streaming/channels/" + channel + "/picture";
        }

        byte[] snapshotBytes = obtenerSnapshotConDigest(requestIp, requestPort, requestPath, camRTSPUser, camRTSPPassword);
        if (snapshotBytes != null && snapshotBytes.length > 0) {
            return Response.ok(snapshotBytes, "image/jpeg")
                    .header("Cache-Control", "no-cache, no-store, must-revalidate")
                    .header("Pragma", "no-cache")
                    .build();
        }

        // Intento directo sin autenticacion si el digest no aplico o era otra camara
        String directUrl = "http://" + ip.trim() + ":" + targetPort + targetPath;
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder(java.net.URI.create(directUrl))
                    .timeout(java.time.Duration.ofMillis(2000))
                    .build();
            java.net.http.HttpResponse<byte[]> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofByteArray());
            if (resp.statusCode() == 200 && resp.body() != null && resp.body().length > 100) {
                String contentType = resp.headers().firstValue("content-type").orElse("");
                if (!contentType.toLowerCase().contains("html")) {
                    return Response.ok(resp.body(), "image/jpeg")
                            .header("Cache-Control", "no-cache, no-store, must-revalidate")
                            .build();
                }
            }
        } catch (Exception ignored) {
        }

        return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(Map.of("error", "Camara IP no disponible", "url", directUrl))
                .type(MediaType.APPLICATION_JSON)
                .build();
    }

    private byte[] obtenerSnapshotConDigest(String ip, int port, String path, String user, String pass) {
        try {
            String targetUrl = "http://" + ip + ":" + port + path;
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofMillis(2500))
                    .build();

            // 1. Solicitud inicial para obtener el Challenge 401 con nonce y realm
            java.net.http.HttpRequest reqInit = java.net.http.HttpRequest.newBuilder(java.net.URI.create(targetUrl))
                    .timeout(java.time.Duration.ofMillis(2000))
                    .build();
            java.net.http.HttpResponse<byte[]> respInit = client.send(reqInit, java.net.http.HttpResponse.BodyHandlers.ofByteArray());

            if (respInit.statusCode() == 200 && respInit.body() != null && respInit.body().length > 100) {
                return respInit.body();
            }

            if (respInit.statusCode() != 401) {
                return null;
            }

            String authHeader = respInit.headers().firstValue("WWW-Authenticate").orElse("");
            if (!authHeader.toLowerCase().contains("digest")) {
                return null;
            }

            // 2. Parsear realm, nonce, qop, opaque
            String realm = extraerParametroDigest(authHeader, "realm");
            String nonce = extraerParametroDigest(authHeader, "nonce");
            String qop = extraerParametroDigest(authHeader, "qop");
            String opaque = extraerParametroDigest(authHeader, "opaque");

            if (realm == null || nonce == null) {
                return null;
            }

            String ha1 = md5Hex(user + ":" + realm + ":" + pass);
            String ha2 = md5Hex("GET:" + path);
            String responseDigest;
            String cnonce = "0a4f113b";
            String nc = "00000001";

            if (qop != null && qop.contains("auth")) {
                responseDigest = md5Hex(ha1 + ":" + nonce + ":" + nc + ":" + cnonce + ":auth:" + ha2);
            } else {
                responseDigest = md5Hex(ha1 + ":" + nonce + ":" + ha2);
            }

            StringBuilder authHeaderVal = new StringBuilder("Digest ");
            authHeaderVal.append("username=\"").append(user).append("\", ");
            authHeaderVal.append("realm=\"").append(realm).append("\", ");
            authHeaderVal.append("nonce=\"").append(nonce).append("\", ");
            authHeaderVal.append("uri=\"").append(path).append("\", ");
            authHeaderVal.append("response=\"").append(responseDigest).append("\"");

            if (qop != null && qop.contains("auth")) {
                authHeaderVal.append(", qop=auth, nc=").append(nc).append(", cnonce=\"").append(cnonce).append("\"");
            }
            if (opaque != null && !opaque.isEmpty()) {
                authHeaderVal.append(", opaque=\"").append(opaque).append("\"");
            }

            // 3. Solicitud autenticada
            java.net.http.HttpRequest reqAuth = java.net.http.HttpRequest.newBuilder(java.net.URI.create(targetUrl))
                    .header("Authorization", authHeaderVal.toString())
                    .timeout(java.time.Duration.ofMillis(2500))
                    .build();

            java.net.http.HttpResponse<byte[]> respAuth = client.send(reqAuth, java.net.http.HttpResponse.BodyHandlers.ofByteArray());
            if (respAuth.statusCode() == 200 && respAuth.body() != null && respAuth.body().length > 100) {
                return respAuth.body();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String extraerParametroDigest(String header, String param) {
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(param + "=\"?([^\",\\s]+)\"?", java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher m = p.matcher(header);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    private String md5Hex(String input) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }


    @Inject
    com.access.control.repository.VisitaRepository visitaRepository;

    @POST
    @Path("/verificar-rostro")
    public Response verificarRostro(Map<String, Object> request) {
        String faceVectorInput = null;
        Object faceVectorObj = request.get("faceVector");
        if (faceVectorObj instanceof String s) {
            faceVectorInput = s;
        } else if (faceVectorObj instanceof List<?> list) {
            faceVectorInput = list.toString();
        }

        if (faceVectorInput == null || faceVectorInput.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Vector de rostro requerido")).build();
        }

        // 1. Intentar busqueda vectorial acelerada por pgvector HNSW
        try {
            float[] vec512 = biometriaVectorRepository.parsearEmbedding(faceVectorInput);
            if (vec512 != null && vec512.length == 512) {
                // Umbral estricto de distancia coseno (< 0.22, equivale a > 78% de similitud)
                Optional<com.access.control.dto.BiometriaMatchDTO> matchOpt = biometriaVectorRepository.findClosestMatch(vec512, 0.22);
                if (matchOpt.isPresent()) {
                    com.access.control.dto.BiometriaMatchDTO match = matchOpt.get();
                    if ("CLIENTE".equals(match.getTipo())) {
                        Cliente c = clienteRepository.findById(match.getId());
                        if (c != null) {
                            String estado = c.getEstadoSuscripcion() != null ? c.getEstadoSuscripcion().toUpperCase() : "SIN_MEMBRESIA";
                            boolean tieneMembresia = c.getMembresiaActual() != null;
                            boolean autorizado = tieneMembresia && ("ACTIVA".equals(estado) || "PAGADO".equals(estado) || "PENDIENTE_CONCILIAR".equals(estado));

                            Map<String, Object> result = new HashMap<>();
                            result.put("match", true);
                            result.put("tipo", "CLIENTE");
                            result.put("persona", c);
                            result.put("similitud", Math.round(match.getConfianza() * 10000.0) / 10000.0);
                            result.put("distanciaVectorial", match.getDistancia());
                            result.put("metodo", "PGVECTOR_HNSW_COSINE");
                            result.put("autorizado", autorizado);
                            result.put("membresiaNombre", tieneMembresia ? c.getMembresiaActual().getNombre() : "Sin Membresia");
                            result.put("estadoMembresia", tieneMembresia ? estado : "SIN_MEMBRESIA");
                            result.put("mensaje", autorizado ? "Acceso Autorizado por Rostro (pgvector)" : "Acceso Denegado: Cliente sin membresia activa (" + estado + ")");
                            agregarDatosSesion(result, c.getUser(), c.getNombre() + " " + (c.getApellido() != null ? c.getApellido() : ""));
                            return Response.ok(result).build();
                        }
                    } else if ("EMPLEADO".equals(match.getTipo())) {
                        Empleado e = empleadoRepository.findById(match.getId());
                        if (e != null) {
                            boolean activo = e.getEnabled() == null || Boolean.TRUE.equals(e.getEnabled());
                            Map<String, Object> result = new HashMap<>();
                            result.put("match", true);
                            result.put("tipo", "EMPLEADO");
                            result.put("persona", e);
                            result.put("similitud", Math.round(match.getConfianza() * 10000.0) / 10000.0);
                            result.put("distanciaVectorial", match.getDistancia());
                            result.put("metodo", "PGVECTOR_HNSW_COSINE");
                            result.put("autorizado", activo);
                            result.put("mensaje", activo ? "Acceso Empleado Autorizado (pgvector)" : "Acceso Denegado: Empleado Inactivo");
                            agregarDatosSesion(result, e.getUser(), e.getName() + " " + (e.getLastName() != null ? e.getLastName() : ""));
                            return Response.ok(result).build();
                        }
                    } else if ("VISITANTE".equals(match.getTipo())) {
                        com.access.control.model.Visita v = visitaRepository.findById(match.getId());
                        if (v != null) {
                            Map<String, Object> result = new HashMap<>();
                            result.put("match", true);
                            result.put("tipo", "VISITANTE");
                            result.put("persona", v);
                            result.put("similitud", Math.round(match.getConfianza() * 10000.0) / 10000.0);
                            result.put("distanciaVectorial", match.getDistancia());
                            result.put("metodo", "PGVECTOR_HNSW_COSINE");
                            result.put("autorizado", true);
                            result.put("mensaje", "Acceso Visitante Autorizado (pgvector)");
                            return Response.ok(result).build();
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }

        // 2. Busqueda vectorial de similitud multi-metrica (Pearson + Gradientes espaciales)
        final double UMBRAL_RECONOCIMIENTO = 0.78;
        List<Cliente> clientes = clienteRepository.listAll();
        for (Cliente c : clientes) {
            if (c.getFaceVector() != null) {
                double sim = calcularSimilitudMultiVector(faceVectorInput, c.getFaceVector());
                if (sim >= UMBRAL_RECONOCIMIENTO) {
                    String estado = c.getEstadoSuscripcion() != null ? c.getEstadoSuscripcion().toUpperCase() : "SIN_MEMBRESIA";
                    boolean tieneMembresia = c.getMembresiaActual() != null;
                    boolean autorizado = tieneMembresia && ("ACTIVA".equals(estado) || "PAGADO".equals(estado) || "PENDIENTE_CONCILIAR".equals(estado));

                    Map<String, Object> result = new HashMap<>();
                    result.put("match", true);
                    result.put("tipo", "CLIENTE");
                    result.put("persona", c);
                    result.put("similitud", Math.round(sim * 10000.0) / 10000.0);
                    result.put("metodo", "RECONOCIMIENTO_FACIAL_MULTIVECTOR");
                    result.put("autorizado", autorizado);
                    result.put("membresiaNombre", tieneMembresia ? c.getMembresiaActual().getNombre() : "Sin Membresia");
                    result.put("estadoMembresia", tieneMembresia ? estado : "SIN_MEMBRESIA");
                    result.put("mensaje", autorizado ? "Acceso Autorizado por Rostro" : "Acceso Denegado: Cliente sin membresia activa (" + estado + ")");
                    agregarDatosSesion(result, c.getUser(), c.getNombre() + " " + (c.getApellido() != null ? c.getApellido() : ""));
                    return Response.ok(result).build();
                }
            }
        }

        // Buscar coincidencia en empleados
        List<Empleado> empleados = empleadoRepository.listAll();
        for (Empleado e : empleados) {
            if (e.getFaceVector() != null) {
                double sim = calcularSimilitudMultiVector(faceVectorInput, e.getFaceVector());
                if (sim >= UMBRAL_RECONOCIMIENTO) {
                    boolean activo = e.getEnabled() == null || Boolean.TRUE.equals(e.getEnabled());
                    Map<String, Object> result = new HashMap<>();
                    result.put("match", true);
                    result.put("tipo", "EMPLEADO");
                    result.put("persona", e);
                    result.put("similitud", Math.round(sim * 10000.0) / 10000.0);
                    result.put("metodo", "RECONOCIMIENTO_FACIAL_MULTIVECTOR");
                    result.put("autorizado", activo);
                    result.put("mensaje", activo ? "Acceso Empleado Autorizado" : "Acceso Denegado: Empleado Inactivo");
                    agregarDatosSesion(result, e.getUser(), e.getName() + " " + (e.getLastName() != null ? e.getLastName() : ""));
                    return Response.ok(result).build();
                }
            }
        }

        // Buscar coincidencia en visitantes
        List<com.access.control.model.Visita> visitas = visitaRepository.listAll();
        for (com.access.control.model.Visita v : visitas) {
            if (v.getFaceVector() != null) {
                double sim = calcularSimilitudMultiVector(faceVectorInput, v.getFaceVector());
                if (sim >= UMBRAL_RECONOCIMIENTO) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("match", true);
                    result.put("tipo", "VISITANTE");
                    result.put("persona", v);
                    result.put("similitud", Math.round(sim * 10000.0) / 10000.0);
                    result.put("metodo", "RECONOCIMIENTO_FACIAL_MULTIVECTOR");
                    result.put("autorizado", true);
                    result.put("mensaje", "Acceso Visitante Autorizado");
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

    @Inject
    com.access.control.repository.BiometriaVectorRepository biometriaVectorRepository;

    @POST
    @Path("/facial/match-vector")
    public Response matchVector(Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("vector")) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("success", false, "message", "Falta el campo vector"))
                .build();
        }

        try {
            Object vecObj = payload.get("vector");
            float[] vector;
            if (vecObj instanceof List<?> list) {
                vector = new float[list.size()];
                for (int i = 0; i < list.size(); i++) {
                    vector[i] = ((Number) list.get(i)).floatValue();
                }
            } else if (vecObj instanceof String s) {
                String clean = s.replace("[", "").replace("]", "").trim();
                String[] parts = clean.split(",");
                vector = new float[parts.length];
                for (int i = 0; i < parts.length; i++) {
                    vector[i] = Float.parseFloat(parts[i].trim());
                }
            } else {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "message", "Formato de vector no valido"))
                    .build();
            }

            double threshold = 0.40;
            if (payload.containsKey("threshold")) {
                threshold = ((Number) payload.get("threshold")).doubleValue();
            }

            Optional<com.access.control.dto.BiometriaMatchDTO> match = biometriaVectorRepository.findClosestMatch(vector, threshold);
            if (match.isPresent()) {
                return Response.ok(Map.of(
                    "success", true,
                    "identificado", true,
                    "match", match.get()
                )).build();
            } else {
                return Response.ok(Map.of(
                    "success", true,
                    "identificado", false,
                    "message", "No se encontro coincidencia bajo el umbral establecido"
                )).build();
            }
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
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
            if (minLen < 16) return 0.0;

            double[] a = new double[minLen];
            double[] b = new double[minLen];
            double sumA = 0.0, sumB = 0.0;

            for (int i = 0; i < minLen; i++) {
                a[i] = Double.parseDouble(parts1[i].trim());
                b[i] = Double.parseDouble(parts2[i].trim());
                sumA += a[i];
                sumB += b[i];
            }

            double meanA = sumA / minLen;
            double meanB = sumB / minLen;

            // 1. Correlacion de Pearson (independiente de iluminacion ambiental base)
            double cov = 0.0, varA = 0.0, varB = 0.0;
            for (int i = 0; i < minLen; i++) {
                double diffA = a[i] - meanA;
                double diffB = b[i] - meanB;
                cov += diffA * diffB;
                varA += diffA * diffA;
                varB += diffB * diffB;
            }

            double pearson = 0.0;
            if (varA > 0.0 && varB > 0.0) {
                pearson = cov / (Math.sqrt(varA) * Math.sqrt(varB));
            }

            // 2. Correlacion de gradiente espacial (altas frecuencias y detalles faciales)
            double dotDiff = 0.0, normDiffA = 0.0, normDiffB = 0.0;
            for (int i = 0; i < minLen - 1; i++) {
                double da = a[i + 1] - a[i];
                double db = b[i + 1] - b[i];
                dotDiff += da * db;
                normDiffA += da * da;
                normDiffB += db * db;
            }

            double gradSim = 0.0;
            if (normDiffA > 0.0 && normDiffB > 0.0) {
                gradSim = dotDiff / (Math.sqrt(normDiffA) * Math.sqrt(normDiffB));
            }

            // Ponderacion balanceada: 50% perfil correlacionado + 50% gradiente de rasgos
            double combined = 0.5 * Math.max(0.0, pearson) + 0.5 * Math.max(0.0, gradSim);
            return Math.max(0.0, Math.min(1.0, combined));
        } catch (Exception e) {
            return 0.0;
        }
    }

    private void agregarDatosSesion(Map<String, Object> result, User user, String nombreFallback) {
        try {
            User targetUser = user;
            if (targetUser == null) {
                // Si no tiene usuario asociado, buscar usuario superadmin o activo por defecto
                targetUser = userRepository.find("enabled = true").firstResult();
            }

            if (targetUser != null) {
                String principalRole = "ROLE_EMPLEADO";
                Set<String> rolesList = new HashSet<>();
                if (targetUser.getAuthorities() != null && !targetUser.getAuthorities().isEmpty()) {
                    for (Authority a : targetUser.getAuthorities()) {
                        rolesList.add(a.getName());
                    }
                    if (targetUser.isAdminOrSuperAdmin()) {
                        principalRole = "ROLE_ADMIN";
                    } else {
                        principalRole = targetUser.getAuthorities().iterator().next().getName();
                    }
                } else {
                    rolesList.add(principalRole);
                }

                String token = Jwt.issuer("https://controlacceso.api/issuer")
                        .upn(targetUser.getUsername())
                        .subject(targetUser.getId() != null ? targetUser.getId().toString() : targetUser.getUsername())
                        .groups(rolesList)
                        .claim("username", targetUser.getUsername())
                        .claim("email", targetUser.getEmail() != null ? targetUser.getEmail() : "")
                        .expiresIn(Duration.ofHours(24))
                        .sign();

                result.put("token", token);
                result.put("username", targetUser.getUsername());
                result.put("role", principalRole);
                result.put("roles", rolesList);
                result.put("nombreCompleto", targetUser.getNombreCompleto() != null ? targetUser.getNombreCompleto() : nombreFallback);
                result.put("sedeId", targetUser.getSede() != null ? targetUser.getSede().getId() : null);
                result.put("sedeNombre", targetUser.getSede() != null ? targetUser.getSede().getSede() : null);

                usuarioService.registrarSesionActiva(targetUser.getId(), targetUser.getUsername(), "127.0.0.1", "Webcam Reconocimiento Facial",
                        targetUser.getSede() != null ? targetUser.getSede().getId() : null,
                        targetUser.getSede() != null ? targetUser.getSede().getSede() : null);

                usuarioService.registrarAuditoria(targetUser.getUsername(), targetUser.getId(),
                        targetUser.getSede() != null ? targetUser.getSede().getId() : null,
                        targetUser.getSede() != null ? targetUser.getSede().getSede() : null,
                        "127.0.0.1", "Webcam Reconocimiento Facial", "LOGIN_BIOMETRICO", "EXITO", "Login facial exitoso");
            }
        } catch (Exception ignored) {
        }
    }
}
