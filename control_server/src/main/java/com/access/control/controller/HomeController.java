package com.access.control.controller;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/")
public class HomeController {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response index() {
        return Response.ok(Map.of(
            "status", "UP",
            "system", "Control de Acceso API",
            "framework", "Quarkus 3.8.3",
            "version", "2.0.0"
        )).build();
    }
}
