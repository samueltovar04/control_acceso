package com.access.control.controller;

import com.access.control.model.Membresia;
import com.access.control.model.Promocion;
import com.access.control.model.SuscripcionCliente;
import com.access.control.repository.MembresiaRepository;
import com.access.control.repository.PromocionRepository;
import com.access.control.repository.SuscripcionClienteRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/membresias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MembresiaResource {

    @Inject
    MembresiaRepository membresiaRepository;

    @Inject
    PromocionRepository promocionRepository;

    @Inject
    SuscripcionClienteRepository suscripcionRepository;

    @GET
    public List<Membresia> getMembresiasActivas() {
        return membresiaRepository.findActivas();
    }

    @GET
    @Path("/todas")
    public List<Membresia> getTodasMembresias() {
        return membresiaRepository.listAll();
    }

    @POST
    @Transactional
    public Response createMembresia(Membresia membresia) {
        membresiaRepository.persist(membresia);
        return Response.status(Response.Status.CREATED).entity(membresia).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response updateMembresia(@PathParam("id") Long id, Membresia updated) {
        Membresia entity = membresiaRepository.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        entity.setNombre(updated.getNombre());
        entity.setDescripcion(updated.getDescripcion());
        entity.setPrecio(updated.getPrecio());
        entity.setPeriodicidad(updated.getPeriodicidad());
        entity.setDuracionesDias(updated.getDuracionesDias());
        if (updated.getActivo() != null) {
            entity.setActivo(updated.getActivo());
        }
        return Response.ok(entity).build();
    }

    @GET
    @Path("/promociones")
    public List<Promocion> getPromociones(@QueryParam("incluirInactivas") @DefaultValue("false") boolean incluirInactivas) {
        if (incluirInactivas) {
            return promocionRepository.listAll();
        }
        return promocionRepository.findActivas();
    }

    @PATCH
    @Path("/promociones/{id}/toggle-activo")
    @Transactional
    public Response toggleActivoPromocion(@PathParam("id") Long id) {
        Promocion entity = promocionRepository.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        boolean nuevoEstado = !(entity.getActivo() != null && entity.getActivo());
        entity.setActivo(nuevoEstado);
        return Response.ok(entity).build();
    }

    @POST
    @Path("/promociones")
    @Transactional
    public Response createPromocion(Promocion promocion) {
        if (promocion.getCodigo() != null) {
            promocion.setCodigo(promocion.getCodigo().trim().toUpperCase());
        }
        if (promocion.getActivo() == null) {
            promocion.setActivo(true);
        }
        promocionRepository.persist(promocion);
        return Response.status(Response.Status.CREATED).entity(promocion).build();
    }

    @PUT
    @Path("/promociones/{id}")
    @Transactional
    public Response updatePromocion(@PathParam("id") Long id, Promocion updated) {
        Promocion entity = promocionRepository.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        entity.setNombre(updated.getNombre());
        if (updated.getCodigo() != null) {
            entity.setCodigo(updated.getCodigo().trim().toUpperCase());
        }
        entity.setTipoDescuento(updated.getTipoDescuento());
        entity.setValorDescuento(updated.getValorDescuento());
        entity.setFechaInicio(updated.getFechaInicio());
        entity.setFechaFin(updated.getFechaFin());
        if (updated.getActivo() != null) {
            entity.setActivo(updated.getActivo());
        }
        if (updated.getMembresiaAplica() != null && updated.getMembresiaAplica().getId() != null) {
            Membresia m = membresiaRepository.findById(updated.getMembresiaAplica().getId());
            entity.setMembresiaAplica(m);
        } else {
            entity.setMembresiaAplica(null);
        }
        return Response.ok(entity).build();
    }

    @DELETE
    @Path("/promociones/{id}")
    @Transactional
    public Response deletePromocion(@PathParam("id") Long id) {
        Promocion entity = promocionRepository.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        entity.setActivo(false);
        return Response.noContent().build();
    }

    @POST
    @Path("/promociones/validar-cupon")
    public Response validarCupon(java.util.Map<String, Object> req) {
        String codigo = req.get("codigo") != null ? req.get("codigo").toString() : null;
        Object membresiaIdObj = req.get("membresiaId");
        Object precioOriginalObj = req.get("precioOriginal");

        if (codigo == null || codigo.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(java.util.Map.of("valido", false, "mensaje", "Codigo de cupon requerido")).build();
        }

        Promocion promo = promocionRepository.findByCodigoActiva(codigo);
        if (promo == null) {
            return Response.ok(java.util.Map.of("valido", false, "mensaje", "Cupon no valido o inactivo")).build();
        }

        java.util.Date hoy = new java.util.Date();
        if (promo.getFechaInicio() != null && hoy.before(promo.getFechaInicio())) {
            return Response.ok(java.util.Map.of("valido", false, "mensaje", "Esta promocion aun no ha comenzado")).build();
        }
        if (promo.getFechaFin() != null && hoy.after(promo.getFechaFin())) {
            return Response.ok(java.util.Map.of("valido", false, "mensaje", "Esta promocion ha expirado")).build();
        }

        if (promo.getMembresiaAplica() != null && membresiaIdObj != null) {
            Long memId = Long.valueOf(membresiaIdObj.toString());
            if (!promo.getMembresiaAplica().getId().equals(memId)) {
                return Response.ok(java.util.Map.of(
                        "valido", false,
                        "mensaje", "Cupon valido solo para la membresia: " + promo.getMembresiaAplica().getNombre()
                )).build();
            }
        }

        java.math.BigDecimal precioBase = java.math.BigDecimal.ZERO;
        if (precioOriginalObj != null) {
            precioBase = new java.math.BigDecimal(precioOriginalObj.toString());
        } else if (promo.getMembresiaAplica() != null && promo.getMembresiaAplica().getPrecio() != null) {
            precioBase = promo.getMembresiaAplica().getPrecio();
        }

        java.math.BigDecimal descuento = java.math.BigDecimal.ZERO;
        String tipo = promo.getTipoDescuento() != null ? promo.getTipoDescuento().toUpperCase() : "PORCENTAJE";
        java.math.BigDecimal val = promo.getValorDescuento() != null ? promo.getValorDescuento() : java.math.BigDecimal.ZERO;
        String beneficioExtra = null;

        if ("PORCENTAJE".equals(tipo)) {
            descuento = precioBase.multiply(val).divide(new java.math.BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        } else if ("MONTO_FIJO".equals(tipo)) {
            descuento = val;
        } else if ("DOS_POR_UNO".equals(tipo) || "2X1".equals(tipo)) {
            descuento = precioBase.multiply(new java.math.BigDecimal("0.50")).setScale(2, java.math.RoundingMode.HALF_UP);
            beneficioExtra = "Promocion 2x1 aplicada (50% de descuento o segundo mes incluido)";
        } else if ("DIAS_EXTRA".equals(tipo) || "MESES_EXTRA".equals(tipo)) {
            descuento = java.math.BigDecimal.ZERO;
            beneficioExtra = "+" + val.intValue() + " dias de acceso extra sin costo adicional";
        }

        if (descuento.compareTo(precioBase) > 0) {
            descuento = precioBase;
        }
        descuento = descuento.setScale(2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal montoFinal = precioBase.subtract(descuento).setScale(2, java.math.RoundingMode.HALF_UP);
        if (montoFinal.compareTo(java.math.BigDecimal.ZERO) < 0) {
            montoFinal = java.math.BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);
        }

        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("valido", true);
        resp.put("promocionId", promo.getId());
        resp.put("nombre", promo.getNombre());
        resp.put("codigo", promo.getCodigo());
        resp.put("tipoDescuento", tipo);
        resp.put("valorDescuento", val);
        resp.put("descuentoMonto", descuento);
        resp.put("precioOriginal", precioBase);
        resp.put("montoFinal", montoFinal);
        if (beneficioExtra != null) {
            resp.put("beneficioExtra", beneficioExtra);
        }
        resp.put("mensaje", "Cupon aplicado exitosamente: " + promo.getNombre());

        return Response.ok(resp).build();
    }


    @POST
    @Path("/suscripciones")
    @Transactional
    public Response suscribirCliente(SuscripcionCliente suscripcion) {
        suscripcionRepository.persist(suscripcion);
        return Response.status(Response.Status.CREATED).entity(suscripcion).build();
    }

    @GET
    @Path("/suscripciones/cliente/{clienteId}")
    public Response getSuscripcionActiva(@PathParam("clienteId") Long clienteId) {
        SuscripcionCliente sub = suscripcionRepository.findActivaPorCliente(clienteId);
        if (sub == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(sub).build();
    }
}
