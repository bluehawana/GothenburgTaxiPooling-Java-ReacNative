package se.gothenburg.taxicarpooling.dto;

import java.time.LocalDateTime;
import java.math.BigDecimal;

public class TripRequestDto {
    private Long userId;
    private String pickupAddress;
    private String destinationAddress;
    private BigDecimal pickupLatitude;
    private BigDecimal pickupLongitude;
    private BigDecimal destinationLatitude;
    private BigDecimal destinationLongitude;
    private LocalDateTime requestedPickupTime;
    private String priority;
    private int passengerCount;
    private boolean needsWheelchairAccess;
    private boolean needsAssistance;
    private String specialRequirements;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
    
    public String getDestinationAddress() { return destinationAddress; }
    public void setDestinationAddress(String destinationAddress) { this.destinationAddress = destinationAddress; }
    
    public BigDecimal getPickupLatitude() { return pickupLatitude; }
    public void setPickupLatitude(BigDecimal pickupLatitude) { this.pickupLatitude = pickupLatitude; }
    
    public BigDecimal getPickupLongitude() { return pickupLongitude; }
    public void setPickupLongitude(BigDecimal pickupLongitude) { this.pickupLongitude = pickupLongitude; }
    
    public BigDecimal getDestinationLatitude() { return destinationLatitude; }
    public void setDestinationLatitude(BigDecimal destinationLatitude) { this.destinationLatitude = destinationLatitude; }
    
    public BigDecimal getDestinationLongitude() { return destinationLongitude; }
    public void setDestinationLongitude(BigDecimal destinationLongitude) { this.destinationLongitude = destinationLongitude; }
    
    public LocalDateTime getRequestedPickupTime() { return requestedPickupTime; }
    public void setRequestedPickupTime(LocalDateTime requestedPickupTime) { this.requestedPickupTime = requestedPickupTime; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public int getPassengerCount() { return passengerCount; }
    public void setPassengerCount(int passengerCount) { this.passengerCount = passengerCount; }
    
    public boolean isNeedsWheelchairAccess() { return needsWheelchairAccess; }
    public void setNeedsWheelchairAccess(boolean needsWheelchairAccess) { this.needsWheelchairAccess = needsWheelchairAccess; }
    
    public boolean isNeedsAssistance() { return needsAssistance; }
    public void setNeedsAssistance(boolean needsAssistance) { this.needsAssistance = needsAssistance; }
    
    public String getSpecialRequirements() { return specialRequirements; }
    public void setSpecialRequirements(String specialRequirements) { this.specialRequirements = specialRequirements; }
}