package com.access.control.component;

import com.access.control.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@Scope("singleton")
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private Map<User,Long> userconnect = new HashMap<>();

    public Map<User, Long> getUserconnect() {
        return userconnect;
    }

    public void setUserconnect(Map<User, Long> userconnect) {
        this.userconnect = userconnect;
    }

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        logger.info("Received a new web socket connection");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) throws InterruptedException, IOException {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String oficina = (String) headerAccessor.getSessionAttributes().get("oficina");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if(username != null) {
            logger.info("User Disconnected : " + username);

            User userMessage = new User();
            userMessage.setUsername(username);
            userconnect.put(userMessage,event.getTimestamp());
            messagingTemplate.convertAndSend("/cliente/public", userMessage);
        }
    }
}
