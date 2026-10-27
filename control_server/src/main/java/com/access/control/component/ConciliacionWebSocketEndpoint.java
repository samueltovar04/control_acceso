package com.access.control.component;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/ws/conciliacion/{canal}")
@ApplicationScoped
public class ConciliacionWebSocketEndpoint {

    // Sesiones activas indexadas por sessionId
    private static final Map<String, Session> sesionesAdmin = new ConcurrentHashMap<>();
    private static final Map<String, Map<String, Session>> sesionesClientes = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("canal") String canal) {
        if ("admin".equalsIgnoreCase(canal)) {
            sesionesAdmin.put(session.getId(), session);
        } else {
            sesionesClientes.computeIfAbsent(canal, k -> new ConcurrentHashMap<>()).put(session.getId(), session);
        }
    }

    @OnClose
    public void onClose(Session session, @PathParam("canal") String canal) {
        if ("admin".equalsIgnoreCase(canal)) {
            sesionesAdmin.remove(session.getId());
        } else {
            Map<String, Session> map = sesionesClientes.get(canal);
            if (map != null) {
                map.remove(session.getId());
            }
        }
    }

    @OnError
    public void onError(Session session, @PathParam("canal") String canal, Throwable throwable) {
        onClose(session, canal);
    }

    @OnMessage
    public void onMessage(String message, Session session, @PathParam("canal") String canal) {
        // Echo o broadcast interno
        if ("admin".equalsIgnoreCase(canal)) {
            broadcastAdmin(message);
        }
    }

    public static void broadcastAdmin(String jsonPayload) {
        sesionesAdmin.values().forEach(s -> {
            if (s.isOpen()) {
                s.getAsyncRemote().sendText(jsonPayload);
            }
        });
    }

    public static void notificarCliente(Long clienteId, String jsonPayload) {
        if (clienteId == null) return;
        Map<String, Session> map = sesionesClientes.get(String.valueOf(clienteId));
        if (map != null) {
            map.values().forEach(s -> {
                if (s.isOpen()) {
                    s.getAsyncRemote().sendText(jsonPayload);
                }
            });
        }
    }
}
