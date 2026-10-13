package com.biotrack.resource;

import com.biotrack.entity.TelemetriaVitalEntity;
import com.biotrack.entity.UsuarioEntity;
import com.biotrack.repository.TelemetriaVitalRepository;
import com.biotrack.repository.UsuarioRepository;
import io.smallrye.jwt.build.Jwt;
import io.smallrye.common.annotation.NonBlocking;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.mindrot.jbcrypt.BCrypt;

import java.time.Duration;
import java.util.*;

@Path("/api/v1/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    UsuarioRepository usuarioRepository;

    @Inject
    TelemetriaVitalRepository telemetriaVitalRepository;

    @Inject
    JsonWebToken jwt;

    // --- DTOs ---
    public static class RegistroRequest {
        public String correo;
        public String rol;
        public String tipoMembresia;
        public String estadoPago;
        public String idPulseraAsignada;
    }

    public static class LoginRequest {
        public String correo;
        public String password;
    }

    public static class CambiarClaveRequest {
        public String correo;
        public String nuevaClave;
        public String confirmacionClave;
    }

    public static class RegistroFotogramaRequest {
        public String correo;
        public String clave;
        public String fotogramaBase64;
        public String idPulseraAsignada;
        public String tipoMembresia;
    }

    @POST
    @Path("/registrar")
    @NonBlocking
    public Uni<Response> registrar(RegistroRequest request) {
        return Uni.createFrom().item(() -> {
            if (request == null || request.correo == null || request.correo.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "El correo es obligatorio."))
                        .build();
            }

            UsuarioEntity existente = usuarioRepository.findByCorreo(request.correo.trim());
            if (existente != null) {
                return Response.status(Response.Status.CONFLICT)
                        .entity(Map.of("error", "El usuario ya existe en el sistema."))
                        .build();
            }

            UsuarioEntity usuario = new UsuarioEntity();
            usuario.correo = request.correo.trim().toLowerCase();
            usuario.claveEncriptada = BCrypt.hashpw("123456", BCrypt.gensalt(10));
            usuario.rol = (request.rol != null && !request.rol.trim().isEmpty()) ? request.rol.toUpperCase() : "CLIENTE";
            usuario.primerIngreso = true;
            usuario.tipoMembresia = (request.tipoMembresia != null) ? request.tipoMembresia : "ESTANDAR";
            usuario.estadoPago = (request.estadoPago != null) ? request.estadoPago : "PENDIENTE";
            usuario.idPulseraAsignada = request.idPulseraAsignada;

            usuarioRepository.persist(usuario);

            return Response.status(Response.Status.CREATED).entity(Map.of(
                    "mensaje", "Usuario registrado exitosamente con clave generica.",
                    "correo", usuario.correo,
                    "primerIngreso", usuario.primerIngreso,
                    "rol", usuario.rol
            )).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }

    @POST
    @Path("/login")
    @NonBlocking
    public Uni<Response> login(LoginRequest request) {
        return Uni.createFrom().item(() -> {
            if (request == null || request.correo == null || request.password == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Correo y contrasena son obligatorios."))
                        .build();
            }

            UsuarioEntity usuario = usuarioRepository.findByCorreo(request.correo.trim().toLowerCase());
            if (usuario == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "Credenciales invalidas."))
                        .build();
            }

            boolean passwordMatch = false;
            try {
                passwordMatch = BCrypt.checkpw(request.password, usuario.claveEncriptada);
            } catch (Exception e) {
                // Si la clave no estuviese hasheada en formato BCrypt, comparacion de contingencia
                passwordMatch = request.password.equals(usuario.claveEncriptada);
            }

            if (!passwordMatch) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("error", "Credenciales invalidas."))
                        .build();
            }

            // Validacion de primer ingreso
            if (usuario.primerIngreso) {
                return Response.ok(Map.of(
                        "primerIngreso", true,
                        "requiereCambioClave", true,
                        "mensaje", "Debe cambiar su clave en el primer ingreso antes de continuar.",
                        "correo", usuario.correo,
                        "rol", usuario.rol != null ? usuario.rol : "CLIENTE"
                )).build();
            }

            // Emision de Token JWT SmallRye
            String token = Jwt.issuer("https://controlacceso.api/issuer")
                    .upn(usuario.correo)
                    .subject(usuario.id != null ? usuario.id.toString() : usuario.correo)
                    .groups(new HashSet<>(Collections.singletonList(usuario.rol != null ? usuario.rol : "CLIENTE")))
                    .claim("correo", usuario.correo)
                    .claim("idPulseraAsignada", usuario.idPulseraAsignada != null ? usuario.idPulseraAsignada : "")
                    .claim("tipoMembresia", usuario.tipoMembresia != null ? usuario.tipoMembresia : "")
                    .expiresIn(Duration.ofHours(24))
                    .sign();

            return Response.ok(Map.of(
                    "primerIngreso", false,
                    "token", token,
                    "correo", usuario.correo,
                    "rol", usuario.rol != null ? usuario.rol : "CLIENTE",
                    "idPulseraAsignada", usuario.idPulseraAsignada != null ? usuario.idPulseraAsignada : "",
                    "tipoMembresia", usuario.tipoMembresia != null ? usuario.tipoMembresia : "",
                    "estadoPago", usuario.estadoPago != null ? usuario.estadoPago : ""
            )).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }

    @POST
    @Path("/cambiar-clave")
    @NonBlocking
    public Uni<Response> cambiarClave(CambiarClaveRequest request) {
        return Uni.createFrom().item(() -> {
            if (request == null || request.correo == null || request.nuevaClave == null || request.confirmacionClave == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Todos los campos de cambio de clave son obligatorios."))
                        .build();
            }

            if (!request.nuevaClave.equals(request.confirmacionClave)) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "La nueva clave y su confirmacion no coinciden."))
                        .build();
            }

            if (request.nuevaClave.length() < 6) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "La nueva clave debe tener al menos 6 caracteres."))
                        .build();
            }

            UsuarioEntity usuario = usuarioRepository.findByCorreo(request.correo.trim().toLowerCase());
            if (usuario == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Usuario no encontrado."))
                        .build();
            }

            usuario.claveEncriptada = BCrypt.hashpw(request.nuevaClave, BCrypt.gensalt(10));
            usuario.primerIngreso = false;
            usuarioRepository.update(usuario);

            return Response.ok(Map.of(
                    "mensaje", "Clave actualizada con exito. Ahora puede iniciar sesion.",
                    "primerIngreso", false,
                    "correo", usuario.correo
            )).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }

    @POST
    @Path("/registrar-fotograma")
    @NonBlocking
    public Uni<Response> registrarFotograma(RegistroFotogramaRequest request) {
        return Uni.createFrom().item(() -> {
            if (request == null || request.correo == null || request.clave == null || request.fotogramaBase64 == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Correo, clave y fotograma son obligatorios."))
                        .build();
            }

            UsuarioEntity usuario = usuarioRepository.findByCorreo(request.correo.trim().toLowerCase());
            if (usuario == null) {
                usuario = new UsuarioEntity();
                usuario.correo = request.correo.trim().toLowerCase();
                usuario.rol = "CLIENTE";
                usuario.primerIngreso = false; // Como ingresa su clave propia directamente en la app
                usuario.tipoMembresia = (request.tipoMembresia != null) ? request.tipoMembresia : "ESTANDAR";
                usuario.estadoPago = "AL_DIA";
            }

            usuario.claveEncriptada = BCrypt.hashpw(request.clave, BCrypt.gensalt(10));
            usuario.fotogramaBase64 = request.fotogramaBase64;
            if (request.idPulseraAsignada != null && !request.idPulseraAsignada.trim().isEmpty()) {
                usuario.idPulseraAsignada = request.idPulseraAsignada.trim();
            }

            if (usuario.id == null) {
                usuarioRepository.persist(usuario);
            } else {
                usuarioRepository.update(usuario);
            }

            return Response.status(Response.Status.CREATED).entity(Map.of(
                    "mensaje", "Registro autonomo de cliente con fotograma completado exitosamente.",
                    "correo", usuario.correo,
                    "rol", usuario.rol,
                    "idPulseraAsignada", usuario.idPulseraAsignada != null ? usuario.idPulseraAsignada : ""
            )).build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }
}
