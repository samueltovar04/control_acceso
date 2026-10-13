package com.controlaccesomobile.model

import com.google.gson.annotations.SerializedName

// REST Request & Response DTOs

data class LoginRequest(
    @SerializedName("username") val username: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("token") val token: String,
    @SerializedName("username") val username: String,
    @SerializedName("primerIngreso") val primerIngreso: Boolean,
    @SerializedName("tipoUsuario") val tipoUsuario: String? = null,
    @SerializedName("clienteId") val clienteId: Long? = null
)

data class ChangePasswordRequest(
    @SerializedName("username") val username: String,
    @SerializedName("currentPassword") val currentPassword: String,
    @SerializedName("newPassword") val newPassword: String
)

data class RegisterFrameRequest(
    @SerializedName("email") val email: String,
    @SerializedName("nombre") val nombre: String,
    @SerializedName("apellido") val apellido: String,
    @SerializedName("documento") val documento: String,
    @SerializedName("frameBase64") val frameBase64: String
)

data class NotificacionPagoRequest(
    @SerializedName("clienteId") val clienteId: Long = 1,
    @SerializedName("monto") val monto: Double = 50.0,
    @SerializedName("celular") val celular: String = "",
    @SerializedName("banco") val banco: String = "",
    @SerializedName("cedula") val cedula: String = "",
    @SerializedName("fechaPago") val fechaPago: String = "",
    @SerializedName("numeroReferencia") val numeroReferencia: String = ""
)

data class UserProfile(
    @SerializedName("id") val id: Long,
    @SerializedName("nombre") val nombre: String,
    @SerializedName("apellido") val apellido: String,
    @SerializedName("email") val email: String,
    @SerializedName("tipoMembresia") val tipoMembresia: String = "VIP", // VIP, GOLD, ESTANDAR
    @SerializedName("estadoPago") val estadoPago: String = "AL_DIA", // AL_DIA, MOROSO, POR_VENCER
    @SerializedName("pulseraAsociada") val pulseraAsociada: Boolean = true,
    @SerializedName("dispositivoId") val dispositivoId: String? = "ESP32-WEARABLE-01"
)

// WebSocket Real-time Vital Signs DTO

data class VitalSignsPayload(
    @SerializedName("dispositivoId") val dispositivoId: String = "",
    @SerializedName("bpm") val bpm: Int = 0,
    @SerializedName("spo2") val spo2: Int = 0,
    @SerializedName("temperatura") val temperatura: Double = 0.0,
    @SerializedName("skinDetected") val skinDetected: Boolean = true,
    @SerializedName("timestamp") val timestamp: Long = System.currentTimeMillis()
)
