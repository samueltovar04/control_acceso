package com.andessistemas.controlacceso.network

import com.andessistemas.controlacceso.model.VitalSignsPayload
import com.google.gson.Gson
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import okhttp3.*

class VitalSignsWebSocketClient(
    private val okHttpClient: OkHttpClient,
    private val gson: Gson = Gson()
) {
    private var webSocket: WebSocket? = null

    fun observeVitalSigns(wsUrl: String): Flow<VitalSignsPayload> = callbackFlow {
        val request = Request.Builder()
            .url(wsUrl)
            .build()

        val listener = object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                // Connection established
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val payload = gson.fromJson(text, VitalSignsPayload::class.java)
                    trySend(payload)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                // Handle WebSocket failure
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                close()
            }
        }

        webSocket = okHttpClient.newWebSocket(request, listener)

        awaitClose {
            webSocket?.close(1000, "App closed connection")
        }
    }

    fun disconnect() {
        webSocket?.close(1000, "Manual disconnect")
        webSocket = null
    }
}
