package se.gothenburg.taxicarpooling.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class HomeController {
    
    @GetMapping
    public String home() {
        return "Gothenburg Taxi Carpooling System - API is running!";
    }
    
    @GetMapping("/api")
    public String api() {
        return "Gothenburg Taxi Carpooling API - Ready to accept requests";
    }
}