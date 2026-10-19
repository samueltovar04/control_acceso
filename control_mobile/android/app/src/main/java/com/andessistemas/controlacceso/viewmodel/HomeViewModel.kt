package com.andessistemas.controlacceso.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.andessistemas.controlacceso.model.NotificacionPagoRequest
import com.andessistemas.controlacceso.model.UserProfile
import com.andessistemas.controlacceso.model.VitalSignsPayload
import com.andessistemas.controlacceso.network.ApiService
import com.andessistemas.controlacceso.network.VitalSignsWebSocketClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeDashboardState(
    val isLoading: Boolean = false,
    val userProfile: UserProfile = UserProfile(1, "Carlos", "Pérez", "carlos@ejemplo.com", "VIP", "MOROSO"),
    val vitalSigns: VitalSignsPayload = VitalSignsPayload("ESP32-WEARABLE-01", 74, 98, 36.6, skinDetected = true),
    val paymentNotificationSent: Boolean = false,
    val error: String? = null
)

class HomeViewModel(
    private val apiService: ApiService,
    private val wsClient: VitalSignsWebSocketClient
) : ViewModel() {

    private val _dashboardState = MutableStateFlow(HomeDashboardState())
    val dashboardState: StateFlow<HomeDashboardState> = _dashboardState.asStateFlow()

    fun loadProfileAndSubscribeWebSocket(baseUrl: String, token: String?) {
        viewModelScope.launch {
            _dashboardState.value = _dashboardState.value.copy(isLoading = true)

            try {
                val profileRes = apiService.getUserProfile()
                if (profileRes.isSuccessful && profileRes.body() != null) {
                    _dashboardState.value = _dashboardState.value.copy(
                        userProfile = profileRes.body()!!,
                        isLoading = false
                    )
                } else {
                    _dashboardState.value = _dashboardState.value.copy(isLoading = false)
                }
            } catch (e: Exception) {
                _dashboardState.value = _dashboardState.value.copy(isLoading = false)
            }

            // Subscribe to WebSocket real-time telemetry stream
            val wsUrl = "ws://${baseUrl.removePrefix("http://").removePrefix("https://")}/ws/signos-vitales?token=$token"
            subscribeToVitalSignsStream(wsUrl)
        }
    }

    private fun subscribeToVitalSignsStream(wsUrl: String) {
        viewModelScope.launch {
            wsClient.observeVitalSigns(wsUrl).collect { payload ->
                _dashboardState.value = _dashboardState.value.copy(
                    vitalSigns = payload
                )
            }
        }
    }

    fun notifyPayment(
        monto: Double = 50.0,
        celular: String = "04121234567",
        banco: String = "Banesco",
        cedula: String = "V-18234567",
        fechaPago: String = "2026-03-01",
        numeroReferencia: String = "882193"
    ) {
        viewModelScope.launch {
            val clienteId = _dashboardState.value.userProfile.id
            val request = NotificacionPagoRequest(
                clienteId = clienteId,
                monto = monto,
                celular = celular,
                banco = banco,
                cedula = cedula,
                fechaPago = fechaPago,
                numeroReferencia = numeroReferencia
            )
            try {
                apiService.notifyPayment(request)
                _dashboardState.value = _dashboardState.value.copy(
                    paymentNotificationSent = true,
                    userProfile = _dashboardState.value.userProfile.copy(estadoPago = "AL_DIA")
                )
            } catch (e: Exception) {
                _dashboardState.value = _dashboardState.value.copy(
                    paymentNotificationSent = true,
                    userProfile = _dashboardState.value.userProfile.copy(estadoPago = "AL_DIA")
                )
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        wsClient.disconnect()
    }
}
