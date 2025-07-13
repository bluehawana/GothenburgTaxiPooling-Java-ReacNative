package se.gothenburg.taxicarpooling.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import se.gothenburg.taxicarpooling.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByPersonnummer(String personnummer);
    
    List<User> findByUserType(User.UserType userType);
    
    List<User> findByEligibilityType(User.EligibilityType eligibilityType);
    
    boolean existsByEmail(String email);
    
    boolean existsByPersonnummer(String personnummer);
}