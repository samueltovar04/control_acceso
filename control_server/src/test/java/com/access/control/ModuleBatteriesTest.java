package com.access.control;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class ModuleBatteriesTest {

    @Test
    @DisplayName("DB & Backend: Branding Configuration Test")
    public void testBrandingConfig() {
        given()
            .when().get("/api/v1/branding/config")
            .then()
            .statusCode(200)
            .body("nombreEmpresa", notNullValue());
    }

    @Test
    @DisplayName("DB & Backend: Clientes Module - Creacion y Consulta")
    public void testClientModule() {
        String clientJson = "{\"documento\":\"V-10293847\",\"nombre\":\"Carlos\",\"apellido\":\"Perez\",\"email\":\"carlos.perez@test.com\",\"estadoSuscripcion\":\"ACTIVA\"}";

        given()
            .contentType(ContentType.JSON)
            .body(clientJson)
            .when().post("/api/v1/clientes")
            .then()
            .statusCode(201)
            .body("documento", equalTo("V-10293847"))
            .body("id", notNullValue());
    }

    @Test
    @DisplayName("DB & Backend: Membresias Module - Creacion de Plan")
    public void testMembresiaModule() {
        String planJson = "{\"nombre\":\"Plan Fitness Pro\",\"periodicidad\":\"MENSUAL\",\"precio\":45.00,\"activo\":true}";

        given()
            .contentType(ContentType.JSON)
            .body(planJson)
            .when().post("/api/v1/membresias")
            .then()
            .statusCode(201)
            .body("nombre", equalTo("Plan Fitness Pro"));
    }

    @Test
    @DisplayName("DB & Backend: Finanzas Module - Registro y Balance")
    public void testFinanzasModule() {
        String pagoJson = "{\"monto\":50.00,\"metodoPago\":\"TRANSFERENCIA\",\"origenPago\":\"WEB_ADMIN\",\"registradoPor\":\"Cajero Baterias\",\"estadoPago\":\"COMPLETADO\"}";

        given()
            .contentType(ContentType.JSON)
            .body(pagoJson)
            .when().post("/api/v1/finanzas/pagos")
            .then()
            .statusCode(201)
            .body("monto", notNullValue());

        given()
            .when().get("/api/v1/finanzas/balance")
            .then()
            .statusCode(200)
            .body("totalIngresos", notNullValue());
    }

    @Test
    @DisplayName("Backend: Biometria Facial Vector Verification")
    public void testBiometriaModule() {
        // Primero registrar un cliente con faceVector
        String clientJson = "{\"documento\":\"V-999888\",\"nombre\":\"Biometric\",\"apellido\":\"User\",\"faceVector\":\"0.11,-0.22,0.33,0.44,-0.55\"}";
        given()
            .contentType(ContentType.JSON)
            .body(clientJson)
            .when().post("/api/v1/clientes")
            .then()
            .statusCode(201);

        String bioJson = "{\"faceVector\":\"0.11,-0.22,0.33,0.44,-0.55\"}";

        given()
            .contentType(ContentType.JSON)
            .body(bioJson)
            .when().post("/api/v1/biometria/verificar-rostro")
            .then()
            .statusCode(200)
            .body("match", equalTo(true));
    }

    @Test
    @DisplayName("Backend & DB: Telemetria Signos Vitales e Inferencia Medica")
    public void testTelemetriaModule() {
        // Crear cliente primero para asociar la FK
        String clientJson = "{\"documento\":\"V-777666\",\"nombre\":\"Sensor\",\"apellido\":\"Wearable\"}";
        Integer clientId = given()
            .contentType(ContentType.JSON)
            .body(clientJson)
            .when().post("/api/v1/clientes")
            .then()
            .statusCode(201)
            .extract().path("id");

        String telemetriaJson = "{\"cliente\":{\"id\":" + clientId + "},\"ritmocardiacoBpm\":170,\"saturacionOxigenoSpo2\":87,\"temperaturaCorporal\":39.1,\"nivelEstres\":85}";

        given()
            .contentType(ContentType.JSON)
            .body(telemetriaJson)
            .when().post("/api/v1/telemetria/signos-vitales")
            .then()
            .statusCode(201)
            .body("alertaSalud", equalTo(true));
    }

    @Test
    @DisplayName("Backend & DB: Acceso y Apertura de Torniquetes")
    public void testAccesoTorniquetesModule() {
        String accesoJson = "{\"metodoVerificacion\":\"ROSTRO\",\"concedido\":true}";

        given()
            .contentType(ContentType.JSON)
            .body(accesoJson)
            .when().post("/api/v1/acceso/validar")
            .then()
            .statusCode(200)
            .body("concedido", equalTo(true));
    }
}
