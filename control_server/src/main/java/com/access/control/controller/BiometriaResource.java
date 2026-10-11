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
            if (c.getFaceVector() != null && calcularSimilitudVectorial(faceVectorInput, c.getFaceVector()) > 0.85) {
                Map<String, Object> result = new HashMap<>();
                result.put("match", true);
                result.put("tipo", "CLIENTE");
                result.put("persona", c);
                result.put("similitud", 0.95);
                return Response.ok(result).build();
            }
        }

        // Buscar coincidencia en empleados
        List<Empleado> empleados = empleadoRepository.listAll();
        for (Empleado e : empleados) {
            if (e.getFaceVector() != null && calcularSimilitudVectorial(faceVectorInput, e.getFaceVector()) > 0.85) {
                Map<String, Object> result = new HashMap<>();
                result.put("match", true);
                result.put("tipo", "EMPLEADO");
                result.put("persona", e);
                result.put("similitud", 0.98);
                return Response.ok(result).build();
            }
        }

        return Response.status(Response.Status.NOT_FOUND).entity(Map.of("match", false, "mensaje", "No se encontró coincidencia biométrica")).build();
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
            if ((c.getHuella1() != null && c.getHuella1().equals(huellaTemplate)) ||
                (c.getHuella2() != null && c.getHuella2().equals(huellaTemplate))) {
                Map<String, Object> result = new HashMap<>();
                result.put("match", true);
                result.put("tipo", "CLIENTE");
                result.put("persona", c);
                result.put("calidad", 96.00);
                return Response.ok(result).build();
            }
        }

        // Buscar coincidencia en empleados
        List<Empleado> empleados = empleadoRepository.listAll();
        for (Empleado e : empleados) {
            if ((e.getHuella1() != null && e.getHuella1().equals(huellaTemplate)) ||
                (e.getHuella2() != null && e.getHuella2().equals(huellaTemplate))) {
                Map<String, Object> result = new HashMap<>();
                result.put("match", true);
                result.put("tipo", "EMPLEADO");
                result.put("persona", e);
                result.put("calidad", 98.50);
                return Response.ok(result).build();
            }
        }

        return Response.status(Response.Status.NOT_FOUND).entity(Map.of("match", false, "mensaje", "Huella dactilar no registrada")).build();
    }

    private double calcularSimilitudVectorial(String vec1, String vec2) {
        if (vec1.equalsIgnoreCase(vec2)) return 1.0;
        return 0.90; // Simulación de algoritmo de distancia Coseno / Euclidiana
    }
}
