package se.gothenburg.taxicarpooling.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "shared_trips")
public class SharedTrip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    private TripStatus status = TripStatus.PENDING;
    
    @ManyToOne
    @JoinColumn(name = "assigned_driver_id")
    private User assignedDriver;
    
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    
    private int passengerCount = 0;
    private String pickupSequence;
    private String dropoffSequence;
    
    private Integer estimatedDurationMinutes;
    private Integer actualDurationMinutes;
    
    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime completedAt;
    
    @OneToMany(mappedBy = "sharedTrip")
    private List<TripRequest> tripRequests;
    
    public enum TripStatus {
        PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public TripStatus getStatus() { return status; }
    public void setStatus(TripStatus status) { this.status = status; }
    
    public User getAssignedDriver() { return assignedDriver; }
    public void setAssignedDriver(User assignedDriver) { this.assignedDriver = assignedDriver; }
    
    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }
    
    public BigDecimal getActualCost() { return actualCost; }
    public void setActualCost(BigDecimal actualCost) { this.actualCost = actualCost; }
    
    public int getPassengerCount() { return passengerCount; }
    public void setPassengerCount(int passengerCount) { this.passengerCount = passengerCount; }
    
    public String getPickupSequence() { return pickupSequence; }
    public void setPickupSequence(String pickupSequence) { this.pickupSequence = pickupSequence; }
    
    public String getDropoffSequence() { return dropoffSequence; }
    public void setDropoffSequence(String dropoffSequence) { this.dropoffSequence = dropoffSequence; }
    
    public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }
    
    public Integer getActualDurationMinutes() { return actualDurationMinutes; }
    public void setActualDurationMinutes(Integer actualDurationMinutes) { this.actualDurationMinutes = actualDurationMinutes; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public List<TripRequest> getTripRequests() { return tripRequests; }
    public void setTripRequests(List<TripRequest> tripRequests) { this.tripRequests = tripRequests; }
}