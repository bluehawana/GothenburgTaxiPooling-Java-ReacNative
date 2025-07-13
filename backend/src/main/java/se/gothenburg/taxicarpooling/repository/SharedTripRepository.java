package se.gothenburg.taxicarpooling.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import se.gothenburg.taxicarpooling.entity.SharedTrip;

import java.util.List;

@Repository
public interface SharedTripRepository extends JpaRepository<SharedTrip, Long> {
    
    List<SharedTrip> findByStatus(SharedTrip.TripStatus status);
    
    List<SharedTrip> findByAssignedDriverId(Long driverId);
    
    @Query("SELECT st FROM SharedTrip st WHERE st.status IN ('PENDING', 'ASSIGNED') " +
           "ORDER BY st.createdAt ASC")
    List<SharedTrip> findActiveTrips();
    
    @Query("SELECT COUNT(st) FROM SharedTrip st WHERE st.status = 'COMPLETED' " +
           "AND DATE(st.createdAt) = CURRENT_DATE")
    Long countCompletedSharedTripsToday();
}