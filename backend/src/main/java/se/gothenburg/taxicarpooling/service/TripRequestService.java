package se.gothenburg.taxicarpooling.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import se.gothenburg.taxicarpooling.entity.TripRequest;
import se.gothenburg.taxicarpooling.entity.User;
import se.gothenburg.taxicarpooling.repository.TripRequestRepository;
import se.gothenburg.taxicarpooling.repository.UserRepository;
import se.gothenburg.taxicarpooling.dto.TripRequestDto;

import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal;

@Service
public class TripRequestService {
    
    @Autowired
    private TripRequestRepository tripRequestRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MatchmakingService matchmakingService;
    
    public TripRequest createTripRequest(TripRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        TripRequest tripRequest = new TripRequest();
        tripRequest.setUser(user);
        tripRequest.setPickupAddress(dto.getPickupAddress());
        tripRequest.setDestinationAddress(dto.getDestinationAddress());
        tripRequest.setPickupLatitude(dto.getPickupLatitude());
        tripRequest.setPickupLongitude(dto.getPickupLongitude());
        tripRequest.setDestinationLatitude(dto.getDestinationLatitude());
        tripRequest.setDestinationLongitude(dto.getDestinationLongitude());
        tripRequest.setRequestedPickupTime(dto.getRequestedPickupTime());
        tripRequest.setPriority(TripRequest.Priority.valueOf(dto.getPriority()));
        tripRequest.setPassengerCount(dto.getPassengerCount());
        tripRequest.setNeedsWheelchairAccess(dto.isNeedsWheelchairAccess());
        tripRequest.setNeedsAssistance(dto.isNeedsAssistance());
        tripRequest.setSpecialRequirements(dto.getSpecialRequirements());
        tripRequest.setEstimatedCost(BigDecimal.valueOf(650));
        
        TripRequest savedRequest = tripRequestRepository.save(tripRequest);
        
        // Automatically trigger matchmaking after order creation
        try {
            matchmakingService.processMatchmaking();
        } catch (Exception e) {
            // Log error but don't fail the trip creation
            System.err.println("Matchmaking failed for trip " + savedRequest.getId() + ": " + e.getMessage());
        }
        
        return savedRequest;
    }
    
    public List<TripRequest> getUserTrips(Long userId) {
        return tripRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public List<TripRequest> getPendingTrips() {
        return tripRequestRepository.findByStatusAndRequestedPickupTimeAfter(
            TripRequest.TripStatus.PENDING, LocalDateTime.now()
        );
    }
    
    public TripRequest updateTripStatus(Long tripId, String status) {
        TripRequest trip = tripRequestRepository.findById(tripId)
            .orElseThrow(() -> new RuntimeException("Trip not found"));
            
        trip.setStatus(TripRequest.TripStatus.valueOf(status));
        return tripRequestRepository.save(trip);
    }
    
    public void runMatchmaking() {
        matchmakingService.processMatchmaking();
    }
}