package se.gothenburg.taxicarpooling.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import se.gothenburg.taxicarpooling.entity.TripRequest;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRequestRepository extends JpaRepository<TripRequest, Long> {
    
    List<TripRequest> findByStatusAndRequestedPickupTimeAfter(
        TripRequest.TripStatus status, LocalDateTime time);
    
    List<TripRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<TripRequest> findByStatusIn(List<TripRequest.TripStatus> statuses);
    
    @Query("SELECT tr FROM TripRequest tr WHERE tr.status = :status " +
           "AND tr.requestedPickupTime BETWEEN :startTime AND :endTime")
    List<TripRequest> findPendingTripsInTimeRange(
        @Param("status") TripRequest.TripStatus status,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT COUNT(tr) FROM TripRequest tr WHERE tr.status = 'COMPLETED' " +
           "AND DATE(tr.createdAt) = CURRENT_DATE")
    Long countCompletedTripsToday();
    
    @Query("SELECT COUNT(tr) FROM TripRequest tr WHERE tr.sharedTrip IS NOT NULL " +
           "AND tr.status = 'COMPLETED' AND DATE(tr.createdAt) = CURRENT_DATE")
    Long countSharedTripsToday();
}