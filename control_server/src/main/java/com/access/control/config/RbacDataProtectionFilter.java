package com.access.control.config;

import com.access.control.model.Cliente;
import com.access.control.repository.ClienteRepository;
import com.access.control.services.UsuarioService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Provider
@Priority(Priorities.AUTHORIZATION)
public class RbacDataProtectionFilter implements ContainerRequestFilter {

    @Inject
    JsonWebToken jwt;

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    UsuarioService usuarioService;

    private static final Pattern CLIENTE_ID_PATH_PATTERN = Pattern.compile("^/?api/v1/clientes/(\\d+)(/.*)?$");
    private static final Pattern CLIENTE_API_ID_PATH_PATTERN = Pattern.compile("^/?api/clientes/(\\d+)(/.*)?$");
    private static final Pattern FINANZAS_CLIENTE_PATH_PATTERN = Pattern.compile("^/?api/v1/finanzas/pagos/cliente/(\\d+)(/.*)?$");
    private static final Pattern TELEMETRIA_CLIENTE_PATH_PATTERN = Pattern.compile("^/?api/v1/telemetria/cliente/(\\d+)(/.*)?$");
    private static final Pattern NOTIFICACION_CLIENTE_PATH_PATTERN = Pattern.compile("^/?api/v1/notificaciones/cliente/(\\d+)(/.*)?$");
    private static final Pattern SUSCRIPCION_CLIENTE_PATH_PATTERN = Pattern.compile("^/?api/v1/membresias/suscripciones/cliente/(\\d+)(/.*)?$");

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String method = requestContext.getMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return;
        }

        String path = requestContext.getUriInfo().getPath();
        if (isPublicPath(path)) {
            return;
        }

        // 1. REGLA ZERO-TRUST: Toda ruta no publica exige token JWT valido
        if (jwt == null || jwt.getName() == null || jwt.getName().trim().isEmpty()) {
            abortWithUnauthorized(requestContext, "Acceso no autorizado: Debe proporcionar un token de autenticacion valido.");
            return;
        }

        Set<String> groups = jwt.getGroups();
        boolean isSuperAdmin = false;
        boolean isAdmin = false;
        boolean isContable = false;
        boolean isAnalista = false;
        boolean isOperacion = false;
        boolean isCliente = false;

        if (groups != null) {
            for (String g : groups) {
                if (g == null) continue;
                String up = g.trim().toUpperCase();
                if (up.contains("SUPER_ADMIN") || up.equals("SUPERADMIN")) isSuperAdmin = true;
                if (up.contains("ADMIN")) isAdmin = true;
                if (up.contains("CONTABLE") || up.contains("CONTADOR")) isContable = true;
                if (up.contains("ANALISTA")) isAnalista = true;
                if (up.contains("RECEPCION") || up.contains("OPERACION") || up.contains("SEGURIDAD")) isOperacion = true;
                if (up.contains("CLIENTE")) isCliente = true;
            }
        }

        boolean isPrivileged = isSuperAdmin || isAdmin || isContable || isAnalista || isOperacion;

        // 2. REGLA DE HARDWARE RELAYS: Apertura fisica remota de torniquetes
        if (path.contains("/abrir")) {
            boolean canOpenRelay = isSuperAdmin || isAdmin || isOperacion;
            if (!canOpenRelay) {
                abortWithForbidden(requestContext, "Acceso denegado: Apertura fisica de torniquetes restringida a personal de seguridad y administracion.");
                return;
            }
        }

        // 3. REGLA DE ASIGNACION DE MEMBRESIAS (/api/clientes/{id}/asignar-membresia)
        if (path.contains("asignar-membresia")) {
            boolean canAssign = isSuperAdmin || isAdmin || isContable || isOperacion;
            if (!canAssign) {
                abortWithForbidden(requestContext, "Acceso denegado: Asignacion de membresias reservada a recepcion, contabilidad y administracion.");
                return;
            }
        }

        // 4. REGLA DE MATRIZ DE PERMISOS POR PISOS
        if (path.startsWith("api/v1/permisos") || path.startsWith("/api/v1/permisos")) {
            if (!"GET".equalsIgnoreCase(method) && !isSuperAdmin && !isAdmin) {
                abortWithForbidden(requestContext, "Acceso denegado: Modificacion de permisos restringida a administradores.");
                return;
            }
        }

        // 5. REGLA DE CATALOGO DE MEMBRESIAS Y PROMOCIONES
        if ((path.startsWith("api/v1/membresias") || path.startsWith("/api/v1/membresias")) && !path.contains("validar-cupon")) {
            if (!"GET".equalsIgnoreCase(method) && !isSuperAdmin && !isAdmin && !isContable) {
                abortWithForbidden(requestContext, "Acceso denegado: Modificacion de planes y promociones reservada a administracion y contabilidad.");
                return;
            }
        }

        // 6. REGLA ESTRICTA PARA PERFIL CLIENTE (Prevencion BOLA / IDOR)
        if (isCliente && !isPrivileged) {
            // Bloqueo de acceso a rutas administrativas
            if (path.startsWith("api/admin") || path.startsWith("/api/admin")) {
                abortWithForbidden(requestContext, "Acceso denegado: Modulo restringido a personal administrativo.");
                return;
            }

            // Bloqueo de consultas masivas de personas, empleados o deudores
            if ("GET".equalsIgnoreCase(method)) {
                if (path.equals("api/v1/clientes") || path.equals("/api/v1/clientes") ||
                    path.equals("api/v1/empleados") || path.equals("/api/v1/empleados") ||
                    path.equals("api/v1/visitas") || path.equals("/api/v1/visitas") ||
                    path.equals("api/v1/finanzas/pagos") || path.equals("/api/v1/finanzas/pagos") ||
                    path.equals("api/v1/finanzas/deudores") || path.equals("/api/v1/finanzas/deudores") ||
                    path.equals("api/v1/finanzas/balance") || path.equals("/api/v1/finanzas/balance") ||
                    path.equals("api/v1/finanzas/gastos") || path.equals("/api/v1/finanzas/gastos") ||
                    path.equals("api/v1/telemetria/alertas") || path.equals("/api/v1/telemetria/alertas") ||
                    path.equals("api/v1/membresias/suscripciones") || path.equals("/api/v1/membresias/suscripciones")) {
                    abortWithForbidden(requestContext, "Acceso denegado: No posee permisos para consultar listados globales.");
                    return;
                }
            }

            // Bloqueo de mutaciones sobre infraestructura o configuracion
            if (!"GET".equalsIgnoreCase(method)) {
                if (path.startsWith("api/v1/dispositivos") || path.startsWith("/api/v1/dispositivos") ||
                    path.startsWith("api/v1/pisos") || path.startsWith("/api/v1/pisos") ||
                    path.startsWith("api/v1/sedes") || path.startsWith("/api/v1/sedes") ||
                    path.startsWith("api/v1/gerencias") || path.startsWith("/api/v1/gerencias") ||
                    path.startsWith("api/v1/tipo-contratos") || path.startsWith("/api/v1/tipo-contratos") ||
                    path.startsWith("api/v1/bancos") || path.startsWith("/api/v1/bancos") ||
                    path.startsWith("api/tasas") || path.startsWith("/api/tasas") ||
                    path.startsWith("api/v1/empleados") || path.startsWith("/api/v1/empleados") ||
                    path.startsWith("api/v1/notificaciones") || path.startsWith("/api/v1/notificaciones")) {
                    abortWithForbidden(requestContext, "Acceso denegado: Operacion no autorizada para clientes.");
                    return;
                }
            }

            // Validacion IDOR en rutas parametrizadas por cliente
            Long callerClienteId = extractCallerClienteId();
            Long requestedClienteId = extractRequestedClienteId(path);

            if (requestedClienteId != null) {
                if (callerClienteId == null || !callerClienteId.equals(requestedClienteId)) {
                    registrarIntentoIdor(jwt.getName(), callerClienteId, requestedClienteId, path, method, requestContext);
                    abortWithForbidden(requestContext, "Acceso denegado: Solo el titular puede consultar o modificar sus propios datos.");
                    return;
                }
            }
        }

        // 7. REGLA PARA PERFIL CONTABLE (Segregacion de funciones financieras)
        if (isContable && !isSuperAdmin && !isAdmin) {
            if (!"GET".equalsIgnoreCase(method)) {
                if (path.startsWith("api/v1/dispositivos") || path.startsWith("/api/v1/dispositivos") ||
                    path.startsWith("api/v1/pisos") || path.startsWith("/api/v1/pisos") ||
                    path.startsWith("api/v1/sedes") || path.startsWith("/api/v1/sedes") ||
                    path.startsWith("api/v1/usuarios") || path.startsWith("/api/v1/usuarios")) {
                    abortWithForbidden(requestContext, "Acceso denegado: Perfil contable restringido a gestion financiera.");
                    return;
                }
            }
        }

        // 8. REGLA PARA PERFIL ANALISTA / OPERACION / RECEPCION
        if ((isAnalista || isOperacion) && !isSuperAdmin && !isAdmin && !isContable) {
            if (path.startsWith("api/admin/pagos") && ("PUT".equalsIgnoreCase(method) || "POST".equalsIgnoreCase(method))) {
                abortWithForbidden(requestContext, "Acceso denegado: Conciliacion financiera reservada a administracion y contabilidad.");
                return;
            }
            if (path.startsWith("api/v1/bancos") && !"GET".equalsIgnoreCase(method)) {
                abortWithForbidden(requestContext, "Acceso denegado: Administracion bancaria reservada a administracion y contabilidad.");
                return;
            }
        }
    }

    private Long extractCallerClienteId() {
        Object cidClaim = jwt.getClaim("clienteId");
        if (cidClaim instanceof Number) {
            long val = ((Number) cidClaim).longValue();
            if (val > 0) return val;
        }
        if (jwt.getName() != null && clienteRepository != null) {
            Cliente c = clienteRepository.findByEmail(jwt.getName().trim().toLowerCase());
            if (c != null) {
                return c.getId();
            }
        }
        return null;
    }

    private Long extractRequestedClienteId(String path) {
        Matcher m1 = CLIENTE_ID_PATH_PATTERN.matcher(path);
        if (m1.matches()) {
            return Long.valueOf(m1.group(1));
        }
        Matcher m1b = CLIENTE_API_ID_PATH_PATTERN.matcher(path);
        if (m1b.matches()) {
            return Long.valueOf(m1b.group(1));
        }
        Matcher m2 = FINANZAS_CLIENTE_PATH_PATTERN.matcher(path);
        if (m2.matches()) {
            return Long.valueOf(m2.group(1));
        }
        Matcher m3 = TELEMETRIA_CLIENTE_PATH_PATTERN.matcher(path);
        if (m3.matches()) {
            return Long.valueOf(m3.group(1));
        }
        Matcher m4 = NOTIFICACION_CLIENTE_PATH_PATTERN.matcher(path);
        if (m4.matches()) {
            return Long.valueOf(m4.group(1));
        }
        Matcher m5 = SUSCRIPCION_CLIENTE_PATH_PATTERN.matcher(path);
        if (m5.matches()) {
            return Long.valueOf(m5.group(1));
        }
        return null;
    }

    private void registrarIntentoIdor(String username, Long callerCid, Long targetCid, String path, String method, ContainerRequestContext ctx) {
        if (usuarioService != null) {
            String ip = ctx.getHeaderString("X-Forwarded-For");
            if (ip == null || ip.isBlank()) ip = ctx.getHeaderString("X-Real-IP");
            if (ip == null || ip.isBlank()) ip = "127.0.0.1";
            String userAgent = ctx.getHeaderString(HttpHeaders.USER_AGENT);

            usuarioService.registrarAuditoria(
                    username != null ? username : "CLIENTE",
                    null,
                    null,
                    null,
                    ip,
                    userAgent != null ? userAgent : "WEB",
                    "IDOR_BLOQUEADO",
                    "DENEGADO",
                    String.format("Intento no autorizado de acceso a datos de cliente ID %s desde titular ID %s en %s %s",
                            targetCid, callerCid, method, path)
            );
        }
    }

    private void abortWithUnauthorized(ContainerRequestContext ctx, String message) {
        ctx.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of("error", message))
                .build());
    }

    private void abortWithForbidden(ContainerRequestContext ctx, String message) {
        ctx.abortWith(Response.status(Response.Status.FORBIDDEN)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of("error", message))
                .build());
    }

    private boolean isPublicPath(String path) {
        if (path == null) return false;
        String clean = path.startsWith("/") ? path : "/" + path;
        return clean.startsWith("/api/v1/auth/") ||
               clean.startsWith("/api/clientes/validar-disponibilidad") ||
               clean.startsWith("/api/clientes/registro") ||
               clean.startsWith("/api/tasas/actual") ||
               clean.startsWith("/api/tasas/historico") ||
               clean.startsWith("/api/v1/acceso/validar") ||
               clean.startsWith("/api/acceso/validar") ||
               clean.startsWith("/api/v1/biometria/verificar") ||
               clean.startsWith("/api/v1/telemetria/gateway") ||
               clean.startsWith("/api/v1/telemetria/signos-vitales") ||
               clean.startsWith("/api/v1/branding/config") ||
               clean.startsWith("/q/") ||
               clean.equals("/favicon.ico");
    }
}
