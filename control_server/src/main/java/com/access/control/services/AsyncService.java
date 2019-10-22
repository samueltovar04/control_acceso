package com.access.control.services;

import com.access.control.model.Dispositivo;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface AsyncService {
    void processPing(Dispositivo dis) throws InterruptedException;
}
