package com.access.control.component;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/ws/signos-vitales")
@ApplicationScoped
public class VitalSignsWebSocketEndpoint {

    private Map<String, Session> sessions = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session) {
        sessions.put(session.getId(), session);
    }

    @OnClose
    public void onClose(Session session) {
        sessions.remove(session.getId());
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        sessions.remove(session.getId());
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        broadcast(message);
    }

    public void broadcast(String message) {
        sessions.values().forEach(s -> {
            if (s.isOpen()) {
                s.getAsyncRemote().sendText(message);
            }
        });
    }
}
