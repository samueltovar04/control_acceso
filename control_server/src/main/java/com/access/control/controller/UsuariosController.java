package com.access.control.controller;

import com.access.control.dto.UserDTO;
import com.access.control.model.AuditoriaAcceso;
import com.access.control.model.SesionActiva;
import com.access.control.model.User;
import com.access.control.repository.UserRepository;
import com.access.control.services.UsuarioService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Path("/api/v1/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuariosController {

    @Inject
    UsuarioService usuarioService;

    @Inject
    UserRepository userRepository;

    @Inject
    JsonWebToken jwt;

    private User getCallerUser(SecurityContext sec) {
        String username = null;
        if (jwt != null && jwt.getName() != null && !jwt.getName().isEmpty()) {
            username = jwt.getName();
        } else if (sec != null && sec.getUserPrincipal() != null) {
            username = sec.getUserPrincipal().getName();
        }
        if (username == null) return null;
        return userRepository.findByUsername(username.toLowerCase().trim());
    }

    private boolean isCallerAdmin(User caller) {
        if (caller == null) return false;
        return caller.isAdminOrSuperAdmin();
    }

    @GET
    public Response listarUsuarios(@Context SecurityContext sec) {
        User caller = getCallerUser(sec);
        if (caller == null) {
            // Si no hay token JWT valido, proteger listado
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "No autenticado")).build();
        }

        // Si es ADMIN o SUPER_ADMIN puede ver la lista completa
        if (isCallerAdmin(caller)) {
            return Response.ok(usuarioService.listarUsuarios()).build();
        }

        // Si es usuario regular, unica y exclusivamente puede ver su propio registro
        UserDTO self = usuarioService.obtenerPorId(caller.getId());
        return Response.ok(self != null ? List.of(self) : Collections.emptyList()).build();
    }

    @GET
    @Path("/{id}")
    public Response obtenerUsuario(@PathParam("id") Long id, @Context SecurityContext sec) {
        User caller = getCallerUser(sec);
        if (caller == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "No autenticado")).build();
        }

        // REGLA ESTRICTA DE PRIVACIDAD:
        // Solo el duenio de la cuenta o un ADMIN/SUPERADMIN puede ver el registro
        boolean esDuenio = caller.getId() != null && caller.getId().equals(id);
        if (!esDuenio && !isCallerAdmin(caller)) {
            usuarioService.registrarAuditoria(caller.getUsername(), caller.getId(),
                    caller.getSede() != null ? caller.getSede().getId() : null,
                    caller.getSede() != null ? caller.getSede().getSede() : null,
                    "CLIENT", "WEB", "CONSULTA_IDOR_BLOQUEADA", "DENEGADO",
                    "Intento no autorizado de consultar usuario ID: " + id);

            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Acceso denegado: Solo el titular puede consultar sus datos personales."))
                    .build();
        }

        UserDTO dto = usuarioService.obtenerPorId(id);
        if (dto == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(dto).build();
    }

    @POST
    public Response crearUsuario(UserDTO dto, @Context SecurityContext sec) {
        User caller = getCallerUser(sec);
        if (caller != null && !isCallerAdmin(caller)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Solo administradores pueden crear nuevos usuarios.")).build();
        }

        try {
            UserDTO creado = usuarioService.crearUsuario(dto);
            return Response.status(Response.Status.CREATED).entity(creado).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", e.getMessage())).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Error al crear usuario: " + e.getMessage())).build();
        }
    }

    @PUT
    @Path("/{id}")
    public Response actualizarUsuario(@PathParam("id") Long id, UserDTO dto, @Context SecurityContext sec) {
        User caller = getCallerUser(sec);
        if (caller == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        boolean esDuenio = caller.getId() != null && caller.getId().equals(id);
        if (!esDuenio && !isCallerAdmin(caller)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "No autorizado para modificar datos de otro usuario.")).build();
        }

        // Si el duenio no es admin, no puede auto-otorgarse roles ni cambiar sede asignada ni reactivarse
        if (!isCallerAdmin(caller)) {
            dto.roles = null;
            dto.sedeId = caller.getSede() != null ? caller.getSede().getId() : null;
            dto.enabled = caller.getEnabled();
        }

        UserDTO actualizado = usuarioService.actualizarUsuario(id, dto);
        if (actualizado == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(actualizado).build();
    }

    @PATCH
    @Path("/{id}/estado")
    public Response cambiarEstado(@PathParam("id") Long id, Map<String, Object> body, @Context SecurityContext sec) {
        User caller = getCallerUser(sec);
        if (caller != null && !isCallerAdmin(caller)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Solo administradores pueden activar o inactivar usuarios.")).build();
        }

        boolean enabled = body != null && body.containsKey("enabled") && Boolean.parseBoolean(body.get("enabled").toString());
        boolean ok = usuarioService.cambiarEstado(id, enabled);
        if (!ok) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(Map.of("success", true, "enabled", enabled)).build();
    }

    @PATCH
    @Path("/{id}/reset-password")
    public Response forzarReseteoPassword(@PathParam("id") Long id, @Context SecurityContext sec) {
        User caller = getCallerUser(sec);
        if (caller != null && !isCallerAdmin(caller)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Solo administradores pueden forzar reseteo de claves.")).build();
        }

        boolean ok = usuarioService.forzarReseteoPassword(id);
        if (!ok) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(Map.of("success", true, "requiresPasswordReset", true)).build();
    }

    @GET
    @Path("/auditoria")
    public Response listarAuditoria(@QueryParam("limit") @DefaultValue("100") int limit, @Context SecurityContext sec) {
        User caller = getCallerUser(sec);
        if (caller != null && !isCallerAdmin(caller)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Solo administradores pueden auditar el sistema.")).build();
        }
        return Response.ok(usuarioService.listarAuditoria(limit)).build();
    }

    @GET
    @Path("/sesiones-activas")
    public Response listarSesionesActivas(@Context SecurityContext sec) {
        User caller = getCallerUser(sec);
        if (caller != null && !isCallerAdmin(caller)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Solo administradores pueden ver sesiones activas.")).build();
        }
        return Response.ok(usuarioService.listarSesionesActivas()).build();
    }

    @POST
    @Path("/sesiones-activas/{id}/revocar")
    public Response revocarSesion(@PathParam("id") Long id, @Context SecurityContext sec) {
        User caller = getCallerUser(sec);
        if (caller != null && !isCallerAdmin(caller)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Solo administradores pueden revocar sesiones remotas.")).build();
        }

        boolean ok = usuarioService.revocarSesion(id);
        if (!ok) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(Map.of("success", true, "mensaje", "Sesion revocada")).build();
    }
}
