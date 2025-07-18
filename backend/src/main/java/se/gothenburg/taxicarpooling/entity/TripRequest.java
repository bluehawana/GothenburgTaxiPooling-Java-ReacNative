package se.gothenburg.taxicarpooling.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "trip_requests")
public class TripRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String pickupAddress;
    
    @Column(nullable = false)
    private String destinationAddress;
    
    private BigDecimal pickupLatitude;
    private BigDecimal pickupLongitude;
    private BigDecimal destinationLatitude;
    private BigDecimal destinationLongitude;
    
    @Column(nullable = false)
    private LocalDateTime requestedPickupTime;
    
    private LocalDateTime actualPickupTime;
    private LocalDateTime actualDropoffTime;
    
    @Enumerated(EnumType.STRING)
    private TripStatus status = TripStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.NORMAL;
    
    private int passengerCount = 1;
    private boolean needsWheelchairAccess;
    private boolean needsAssistance;
    
    private String specialRequirements;
    
    @ManyToOne
    @JoinColumn(name = "assigned_driver_id")
    private User assignedDriver;
    
    private LocalDateTime assignedAt;
    
    @ManyToOne
    @JoinColumn(name = "shared_trip_id")
    private SharedTrip sharedTrip;
    
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    
    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public enum TripStatus {
        PENDING, MATCHED, ASSIGNED, PICKUP_CONFIRMED, IN_TRANSIT, COMPLETED, CANCELLED
    }
    
    public enum Priority {
        LOW, NORMAL, HIGH, URGENT
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
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
    
    public LocalDateTime getActualPickupTime() { return actualPickupTime; }
    public void setActualPickupTime(LocalDateTime actualPickupTime) { this.actualPickupTime = actualPickupTime; }
    
    public LocalDateTime getActualDropoffTime() { return actualDropoffTime; }
    public void setActualDropoffTime(LocalDateTime actualDropoffTime) { this.actualDropoffTime = actualDropoffTime; }
    
    public TripStatus getStatus() { return status; }
    public void setStatus(TripStatus status) { this.status = status; }
    
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    
    public int getPassengerCount() { return passengerCount; }
    public void setPassengerCount(int passengerCount) { this.passengerCount = passengerCount; }
    
    public boolean isNeedsWheelchairAccess() { return needsWheelchairAccess; }
    public void setNeedsWheelchairAccess(boolean needsWheelchairAccess) { this.needsWheelchairAccess = needsWheelchairAccess; }
    
    public boolean isNeedsAssistance() { return needsAssistance; }
    public void setNeedsAssistance(boolean needsAssistance) { this.needsAssistance = needsAssistance; }
    
    public String getSpecialRequirements() { return specialRequirements; }
    public void setSpecialRequirements(String specialRequirements) { this.specialRequirements = specialRequirements; }
    
    public User getAssignedDriver() { return assignedDriver; }
    public void setAssignedDriver(User assignedDriver) { this.assignedDriver = assignedDriver; }
    
    public SharedTrip getSharedTrip() { return sharedTrip; }
    public void setSharedTrip(SharedTrip sharedTrip) { this.sharedTrip = sharedTrip; }
    
    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }
    
    public BigDecimal getActualCost() { return actualCost; }
    public void setActualCost(BigDecimal actualCost) { this.actualCost = actualCost; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
}