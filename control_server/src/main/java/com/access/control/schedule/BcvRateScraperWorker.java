package com.access.control.schedule;

import com.access.control.model.TasaCambio;
import com.access.control.repository.TasaCambioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.faulttolerance.Fallback;
import org.eclipse.microprofile.faulttolerance.Retry;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class BcvRateScraperWorker {

    private static final Logger LOG = Logger.getLogger(BcvRateScraperWorker.class);

    private static final String URL_DOLAR_OFICIAL = "https://ve.dolarapi.com/v1/dolares/oficial";
    private static final String URL_EURO_OFICIAL = "https://ve.dolarapi.com/v1/euros/oficial";

    @Inject
    TasaCambioRepository tasaRepository;

    @Inject
    ObjectMapper objectMapper;

    /**
     * Captura programada automatica: Lunes a Viernes a las 18:00 (hora local de publicacion oficial BCV)
     */
    @Scheduled(cron = "0 0 18 ? * MON-FRI", identity = "bcv-rate-scraper")
    @Transactional
    @Retry(maxRetries = 3, delay = 3000)
    @Fallback(fallbackMethod = "fallbackTasaUltimaValida")
    public void ejecutarCapturaTasas() {
        sincronizarTasasOficiales();
    }

    /**
     * Sincronizacion reutilizable tanto para el cron scheduler como para llamadas manuales via API Admin.
     * Retorna solo las monedas que pudieron resolverse (API o BD). Nunca valores inventados.
     */
    @Transactional
    public Map<String, Object> sincronizarTasasOficiales() {
        LOG.info("Iniciando consulta de tasas oficiales desde ve.dolarapi.com...");

        Optional<TasaResultado> usdResultado = consultarDolarApi(URL_DOLAR_OFICIAL, "USD");
        Optional<TasaResultado> eurResultado = consultarDolarApi(URL_EURO_OFICIAL, "EUR");

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("fuente", "ve.dolarapi.com/v1");
        respuesta.put("sincronizadoEl", LocalDateTime.now().toString());

        usdResultado.ifPresentOrElse(r -> {
            guardarOActualizarTasa("USD", "VES", r.valor, r.fechaVigencia);
            respuesta.put("usd", r.valor);
            respuesta.put("vigenciaUSD", r.fechaVigencia.toString());
            LOG.infof("Tasa USD sincronizada: %s VES (vigencia %s)", r.valor, r.fechaVigencia);
        }, () -> {
            LOG.warn("No se pudo obtener tasa USD: sin respuesta de API ni registro previo en BD.");
            respuesta.put("usd", null);
            respuesta.put("errorUSD", "Sin datos disponibles");
        });

        eurResultado.ifPresentOrElse(r -> {
            guardarOActualizarTasa("EUR", "VES", r.valor, r.fechaVigencia);
            respuesta.put("eur", r.valor);
            respuesta.put("vigenciaEUR", r.fechaVigencia.toString());
            LOG.infof("Tasa EUR sincronizada: %s VES (vigencia %s)", r.valor, r.fechaVigencia);
        }, () -> {
            LOG.warn("No se pudo obtener tasa EUR: sin respuesta de API ni registro previo en BD.");
            respuesta.put("eur", null);
            respuesta.put("errorEUR", "Sin datos disponibles");
        });

        return respuesta;
    }

    private void guardarOActualizarTasa(String origen, String destino, BigDecimal valor, LocalDate vigencia) {
        Optional<TasaCambio> opt = tasaRepository.findPorFecha(origen, destino, vigencia);
        TasaCambio tasa = opt.orElseGet(TasaCambio::new);
        tasa.setMonedaOrigen(origen);
        tasa.setMonedaDestino(destino);
        tasa.setValor(valor.setScale(4, RoundingMode.HALF_UP));
        tasa.setFechaVigencia(vigencia);
        tasa.setFechaCaptura(LocalDateTime.now());
        tasa.setOrigenCaptura("DOLARAPI_OFICIAL");

        if (tasa.getId() == null) {
            tasaRepository.persist(tasa);
        }
    }

    /**
     * Intenta obtener tasa desde la API externa. Si falla, busca la ultima vigente en BD.
     * Si tampoco existe en BD, retorna Optional.empty() (cero valores hardcoded).
     */
    private Optional<TasaResultado> consultarDolarApi(String urlString, String moneda) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(6))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(urlString))
                    .timeout(Duration.ofSeconds(8))
                    .header("Accept", "application/json")
                    .header("User-Agent", "ControlAcceso-Gym/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.has("promedio") && !root.get("promedio").isNull()) {
                    BigDecimal promedio = new BigDecimal(root.get("promedio").asText());
                    LocalDate fecha = LocalDate.now();
                    if (root.has("fechaActualizacion") && !root.get("fechaActualizacion").isNull()) {
                        String fechaStr = root.get("fechaActualizacion").asText();
                        if (fechaStr.length() >= 10) {
                            fecha = LocalDate.parse(fechaStr.substring(0, 10));
                        }
                    }
                    return Optional.of(new TasaResultado(promedio, fecha));
                }
            }
            LOG.warnf("Respuesta no estandar desde %s (Status: %d). Buscando en BD.", urlString, response.statusCode());
        } catch (Exception e) {
            LOG.warnf("Error al consultar %s: %s. Buscando ultima tasa en BD.", urlString, e.getMessage());
        }

        // Fallback: ultima tasa vigente en BD. Si no existe, Optional.empty().
        return tasaRepository.findUltimaVigente(moneda, "VES")
                .map(t -> new TasaResultado(t.getValor(), t.getFechaVigencia()));
    }

    public void fallbackTasaUltimaValida() {
        LOG.error("Fallo la sincronizacion externa de tasas tras reintentos configurados.");
    }

    private static class TasaResultado {
        final BigDecimal valor;
        final LocalDate fechaVigencia;

        TasaResultado(BigDecimal valor, LocalDate fechaVigencia) {
            this.valor = valor;
            this.fechaVigencia = fechaVigencia;
        }
    }
}
