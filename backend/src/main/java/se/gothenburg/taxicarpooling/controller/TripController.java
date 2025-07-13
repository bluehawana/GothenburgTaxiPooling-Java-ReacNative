package se.gothenburg.taxicarpooling.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import se.gothenburg.taxicarpooling.entity.TripRequest;
import se.gothenburg.taxicarpooling.service.TripRequestService;
import se.gothenburg.taxicarpooling.dto.TripRequestDto;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*")
public class TripController {
    
    @Autowired
    private TripRequestService tripRequestService;
    
    @PostMapping("/book")
    public ResponseEntity<TripRequest> bookTrip(@RequestBody TripRequestDto tripRequestDto) {
        try {
            TripRequest savedTrip = tripRequestService.createTripRequest(tripRequestDto);
            return ResponseEntity.ok(savedTrip);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TripRequest>> getUserTrips(@PathVariable Long userId) {
        List<TripRequest> trips = tripRequestService.getUserTrips(userId);
        return ResponseEntity.ok(trips);
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<TripRequest>> getPendingTrips() {
        List<TripRequest> trips = tripRequestService.getPendingTrips();
        return ResponseEntity.ok(trips);
    }
    
    @PutMapping("/{tripId}/status")
    public ResponseEntity<TripRequest> updateTripStatus(
            @PathVariable Long tripId,
            @RequestParam String status) {
        try {
            TripRequest updatedTrip = tripRequestService.updateTripStatus(tripId, status);
            return ResponseEntity.ok(updatedTrip);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/matchmaking")
    public ResponseEntity<String> runMatchmaking() {
        try {
            tripRequestService.runMatchmaking();
            return ResponseEntity.ok("Matchmaking completed successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Matchmaking failed: " + e.getMessage());
        }
    }
}