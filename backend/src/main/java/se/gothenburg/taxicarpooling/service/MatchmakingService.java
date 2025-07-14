package se.gothenburg.taxicarpooling.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import se.gothenburg.taxicarpooling.entity.TripRequest;
import se.gothenburg.taxicarpooling.entity.SharedTrip;
import se.gothenburg.taxicarpooling.repository.TripRequestRepository;
import se.gothenburg.taxicarpooling.repository.SharedTripRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchmakingService {
    
    @Autowired
    private TripRequestRepository tripRequestRepository;
    
    @Autowired
    private SharedTripRepository sharedTripRepository;
    
    @Value("${government.max.passengers.per.trip}")
    private int maxPassengersPerTrip;
    
    @Value("${government.cost.per.shared.trip}")
    private BigDecimal costPerSharedTrip;
    
    @Value("${realtime.service.url:http://localhost:3001}")
    private String realtimeServiceUrl;
    
    private RestTemplate restTemplate = new RestTemplate();
    
    private static final double MAX_PICKUP_DISTANCE_KM = 2.0;
    private static final double MAX_DESTINATION_DISTANCE_KM = 2.0;
    private static final int MAX_TIME_DIFFERENCE_MINUTES = 30;
    
    public void processMatchmaking() {
        List<TripRequest> pendingTrips = tripRequestRepository.findByStatusAndRequestedPickupTimeAfter(
            TripRequest.TripStatus.PENDING, LocalDateTime.now()
        );
        
        Map<String, List<TripRequest>> tripsByTimeSlot = groupTripsByTimeSlot(pendingTrips);
        
        for (List<TripRequest> tripsInSlot : tripsByTimeSlot.values()) {
            createOptimalMatches(tripsInSlot);
        }
    }
    
    private Map<String, List<TripRequest>> groupTripsByTimeSlot(List<TripRequest> trips) {
        return trips.stream()
            .collect(Collectors.groupingBy(trip -> 
                trip.getRequestedPickupTime().toLocalDate().toString() + "_" +
                (trip.getRequestedPickupTime().getHour() / 2) * 2
            ));
    }
    
    private void createOptimalMatches(List<TripRequest> trips) {
        List<List<TripRequest>> potentialGroups = findCompatibleGroups(trips);
        
        for (List<TripRequest> group : potentialGroups) {
            if (group.size() >= 2 && group.size() <= maxPassengersPerTrip) {
                createSharedTrip(group);
            }
        }
    }
    
    private List<List<TripRequest>> findCompatibleGroups(List<TripRequest> trips) {
        List<List<TripRequest>> groups = new ArrayList<>();
        boolean[] used = new boolean[trips.size()];
        
        for (int i = 0; i < trips.size(); i++) {
            if (used[i]) continue;
            
            List<TripRequest> currentGroup = new ArrayList<>();
            currentGroup.add(trips.get(i));
            used[i] = true;
            
            for (int j = i + 1; j < trips.size(); j++) {
                if (used[j] || currentGroup.size() >= maxPassengersPerTrip) continue;
                
                if (isCompatible(currentGroup, trips.get(j))) {
                    currentGroup.add(trips.get(j));
                    used[j] = true;
                }
            }
            
            if (currentGroup.size() >= 2) {
                groups.add(currentGroup);
            }
        }
        
        return groups;
    }
    
    private boolean isCompatible(List<TripRequest> group, TripRequest newTrip) {
        for (TripRequest existingTrip : group) {
            if (!isTimeCompatible(existingTrip, newTrip) ||
                !isLocationCompatible(existingTrip, newTrip) ||
                !isAccessibilityCompatible(existingTrip, newTrip)) {
                return false;
            }
        }
        return true;
    }
    
    private boolean isTimeCompatible(TripRequest trip1, TripRequest trip2) {
        long timeDifference = Math.abs(
            java.time.Duration.between(trip1.getRequestedPickupTime(), trip2.getRequestedPickupTime()).toMinutes()
        );
        return timeDifference <= MAX_TIME_DIFFERENCE_MINUTES;
    }
    
    private boolean isLocationCompatible(TripRequest trip1, TripRequest trip2) {
        double pickupDistance = calculateDistance(
            trip1.getPickupLatitude(), trip1.getPickupLongitude(),
            trip2.getPickupLatitude(), trip2.getPickupLongitude()
        );
        
        double destinationDistance = calculateDistance(
            trip1.getDestinationLatitude(), trip1.getDestinationLongitude(),
            trip2.getDestinationLatitude(), trip2.getDestinationLongitude()
        );
        
        return pickupDistance <= MAX_PICKUP_DISTANCE_KM && 
               destinationDistance <= MAX_DESTINATION_DISTANCE_KM;
    }
    
    private boolean isAccessibilityCompatible(TripRequest trip1, TripRequest trip2) {
        return !(trip1.isNeedsWheelchairAccess() && trip2.isNeedsWheelchairAccess());
    }
    
    private double calculateDistance(BigDecimal lat1, BigDecimal lon1, BigDecimal lat2, BigDecimal lon2) {
        final int R = 6371;
        
        double latDistance = Math.toRadians(lat2.doubleValue() - lat1.doubleValue());
        double lonDistance = Math.toRadians(lon2.doubleValue() - lon1.doubleValue());
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1.doubleValue())) * Math.cos(Math.toRadians(lat2.doubleValue()))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    private void createSharedTrip(List<TripRequest> tripRequests) {
        SharedTrip sharedTrip = new SharedTrip();
        sharedTrip.setStatus(SharedTrip.TripStatus.PENDING);
        sharedTrip.setEstimatedCost(costPerSharedTrip);
        sharedTrip.setPassengerCount(tripRequests.size());
        
        sharedTrip = sharedTripRepository.save(sharedTrip);
        
        for (TripRequest trip : tripRequests) {
            trip.setSharedTrip(sharedTrip);
            trip.setStatus(TripRequest.TripStatus.MATCHED);
            trip.setEstimatedCost(costPerSharedTrip.divide(BigDecimal.valueOf(tripRequests.size())));
            tripRequestRepository.save(trip);
        }
        
        // Notify real-time service about the new shared trip
        notifyRealtimeService(sharedTrip, tripRequests);
    }
    
    private void notifyRealtimeService(SharedTrip sharedTrip, List<TripRequest> tripRequests) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("sharedTripId", sharedTrip.getId());
            payload.put("status", "MATCHED");
            payload.put("passengerCount", sharedTrip.getPassengerCount());
            
            List<Map<String, Object>> tripData = tripRequests.stream()
                .map(trip -> {
                    Map<String, Object> tripInfo = new HashMap<>();
                    tripInfo.put("tripId", trip.getId());
                    tripInfo.put("userId", trip.getUser().getId());
                    tripInfo.put("pickupAddress", trip.getPickupAddress());
                    tripInfo.put("destinationAddress", trip.getDestinationAddress());
                    tripInfo.put("pickupLatitude", trip.getPickupLatitude());
                    tripInfo.put("pickupLongitude", trip.getPickupLongitude());
                    tripInfo.put("destinationLatitude", trip.getDestinationLatitude());
                    tripInfo.put("destinationLongitude", trip.getDestinationLongitude());
                    tripInfo.put("requestedPickupTime", trip.getRequestedPickupTime());
                    tripInfo.put("passengerCount", trip.getPassengerCount());
                    tripInfo.put("needsWheelchairAccess", trip.isNeedsWheelchairAccess());
                    tripInfo.put("needsAssistance", trip.isNeedsAssistance());
                    return tripInfo;
                })
                .collect(Collectors.toList());
            
            payload.put("trips", tripData);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            restTemplate.postForObject(realtimeServiceUrl + "/api/shared-trip-created", request, String.class);
            
        } catch (Exception e) {
            System.err.println("Failed to notify real-time service: " + e.getMessage());
        }
    }
}