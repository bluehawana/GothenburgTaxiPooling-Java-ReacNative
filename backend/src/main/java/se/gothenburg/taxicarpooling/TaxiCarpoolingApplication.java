package se.gothenburg.taxicarpooling;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TaxiCarpoolingApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaxiCarpoolingApplication.class, args);
    }
}