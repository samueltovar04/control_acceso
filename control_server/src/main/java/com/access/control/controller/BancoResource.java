package com.access.control.controller;

import com.access.control.model.Banco;
import com.access.control.repository.BancoRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/bancos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BancoResource {

    @Inject
    BancoRepository bancoRepository;

    @GET
    @Transactional
    public List<Banco> listarBancosActivos(@QueryParam("tipo") String tipo) {
        List<Banco> bancos = (tipo != null && !tipo.trim().isEmpty())
                ? bancoRepository.findByTipo(tipo.toUpperCase())
                : bancoRepository.findActivos();

        if (bancos.isEmpty()) {
            inicializarBancosPorDefecto();
            bancos = (tipo != null && !tipo.trim().isEmpty())
                    ? bancoRepository.findByTipo(tipo.toUpperCase())
                    : bancoRepository.findActivos();
        }
        return bancos;
    }

    private void inicializarBancosPorDefecto() {
        if (bancoRepository.listAll().isEmpty()) {
            // 1. Pago Móvil BDV
            Banco b1 = new Banco();
            b1.setNombre("BANCO DE VENEZUELA");
            b1.setCodigo("0102");
            b1.setTipo("PAGO_MOVIL");
            b1.setDocumentoTitular("J-31298450-1");
            b1.setTelefono("04121234567");
            b1.setTitular("GIMNASIO FIT CONTROL C.A.");
            b1.setNumeroCuenta("01020000000000000000");
            b1.setMoneda("VES");
            b1.setActivo(true);
            bancoRepository.persist(b1);

            // 2. Zelle
            Banco b2 = new Banco();
            b2.setNombre("Zelle Directo");
            b2.setCodigo("ZELLE");
            b2.setTipo("ZELLE");
            b2.setEmail("pagos@fitcontrol.com");
            b2.setTitular("Fit Control International LLC");
            b2.setMoneda("USD");
            b2.setNotasInstruccion("Enviar el monto exacto y colocar en la nota únicamente su Cédula / DNI.");
            b2.setActivo(true);
            bancoRepository.persist(b2);

            // 3. Binance Pay / Crypto
            Banco b3 = new Banco();
            b3.setNombre("Binance Pay");
            b3.setCodigo("BINANCE");
            b3.setTipo("BINANCE_PAY");
            b3.setEmail("binance@fitcontrol.com");
            b3.setDireccionBilletera("289104812");
            b3.setRed("USDT (TRC20 / BEP20)");
            b3.setMemoQr("MEMO-88219");
            b3.setTitular("Fit Control Crypto Corp");
            b3.setMoneda("USDT");
            b3.setNotasInstruccion("Adjuntar la captura de pantalla con el Hash / TxID de la transacción visible.");
            b3.setActivo(true);
            bancoRepository.persist(b3);
        }
    }

    @GET
    @Path("/todos")
    public List<Banco> listarTodos() {
        return bancoRepository.listAll();
    }

    @GET
    @Path("/{id}")
    public Response obtenerPorId(@PathParam("id") Long id) {
        Banco banco = bancoRepository.findById(id);
        if (banco == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(banco).build();
    }

    @POST
    @Transactional
    public Response crearBanco(Banco banco) {
        if (banco.getNombre() == null || banco.getTipo() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\":\"El nombre y el tipo son obligatorios\"}")
                    .build();
        }
        if (banco.getActivo() == null) {
            banco.setActivo(true);
        }
        bancoRepository.persist(banco);
        return Response.status(Response.Status.CREATED).entity(banco).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response actualizarBanco(@PathParam("id") Long id, Banco bancoData) {
        Banco banco = bancoRepository.findById(id);
        if (banco == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (bancoData.getNombre() != null) banco.setNombre(bancoData.getNombre());
        if (bancoData.getCodigo() != null) banco.setCodigo(bancoData.getCodigo());
        if (bancoData.getTipo() != null) banco.setTipo(bancoData.getTipo());
        if (bancoData.getNumeroCuenta() != null) banco.setNumeroCuenta(bancoData.getNumeroCuenta());
        if (bancoData.getTitular() != null) banco.setTitular(bancoData.getTitular());
        if (bancoData.getDocumentoTitular() != null) banco.setDocumentoTitular(bancoData.getDocumentoTitular());
        if (bancoData.getTelefono() != null) banco.setTelefono(bancoData.getTelefono());
        if (bancoData.getEmail() != null) banco.setEmail(bancoData.getEmail());
        if (bancoData.getRed() != null) banco.setRed(bancoData.getRed());
        if (bancoData.getDireccionBilletera() != null) banco.setDireccionBilletera(bancoData.getDireccionBilletera());
        if (bancoData.getMemoQr() != null) banco.setMemoQr(bancoData.getMemoQr());
        if (bancoData.getMoneda() != null) banco.setMoneda(bancoData.getMoneda());
        if (bancoData.getNotasInstruccion() != null) banco.setNotasInstruccion(bancoData.getNotasInstruccion());
        if (bancoData.getActivo() != null) banco.setActivo(bancoData.getActivo());

        bancoRepository.persist(banco);
        return Response.ok(banco).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response eliminarBanco(@PathParam("id") Long id) {
        Banco banco = bancoRepository.findById(id);
        if (banco == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        banco.setActivo(false);
        bancoRepository.persist(banco);
        return Response.ok("{\"message\":\"Banco desactivado correctamente\"}").build();
    }
}
