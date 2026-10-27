package com.access.control.controller;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;

@Path("/api/v1/branding")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BrandingResource {

    @GET
    @Path("/config")
    public Response getBrandingConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("nombreEmpresa", "Control de Acceso S.A.");
        config.put("logoLoginUrl", "https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
        config.put("logoMenuUrl", "https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
        config.put("colorPrimary", "#1E88E5");
        config.put("colorAccent", "#00ACC1");
        config.put("version", "2.0.0");
        return Response.ok(config).build();
    }
}
