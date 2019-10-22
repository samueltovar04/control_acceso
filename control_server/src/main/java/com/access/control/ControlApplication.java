package com.access.control;

import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.slf4j.Logger;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class ControlApplication  extends SpringBootServletInitializer {

    public static void main(String[] args) {

        final Logger logger = LoggerFactory.getLogger(ControlApplication.class);
        SpringApplication.run(ControlApplication.class, args);
    }
}
