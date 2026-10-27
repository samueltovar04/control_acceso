package com.andessistemas.controlacceso.network

import com.andessistemas.controlacceso.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/v1/auth/cambiar-clave-obligatorio")
    suspend fun changePasswordMandatory(@Body request: ChangePasswordRequest): Response<Unit>

    @POST("api/v1/clientes/registro-fotograma")
    suspend fun registerWithFrame(@Body request: RegisterFrameRequest): Response<UserProfile>

    @GET("api/v1/clientes/perfil")
    suspend fun getUserProfile(): Response<UserProfile>

    @POST("api/v1/finanzas/notificacion-pago")
    suspend fun notifyPayment(@Body request: NotificacionPagoRequest): Response<Unit>
}
