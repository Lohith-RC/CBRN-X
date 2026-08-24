package com.cbrsx.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CbrsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CbrsBackendApplication.class, args);
    }
}

