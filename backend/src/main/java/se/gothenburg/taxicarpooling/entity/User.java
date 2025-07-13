package se.gothenburg.taxicarpooling.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String personnummer;
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    private String phone;
    
    @Enumerated(EnumType.STRING)
    private UserType userType;
    
    @Enumerated(EnumType.STRING)
    private EligibilityType eligibilityType;
    
    private String address;
    private String city;
    private String postalCode;
    
    private boolean needsWheelchairAccess;
    private boolean needsAssistance;
    
    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public enum UserType {
        PASSENGER, DRIVER, ADMIN
    }
    
    public enum EligibilityType {
        ELDERLY, DISABLED, PATIENT, COMPANION
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getPersonnummer() { return personnummer; }
    public void setPersonnummer(String personnummer) { this.personnummer = personnummer; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public UserType getUserType() { return userType; }
    public void setUserType(UserType userType) { this.userType = userType; }
    
    public EligibilityType getEligibilityType() { return eligibilityType; }
    public void setEligibilityType(EligibilityType eligibilityType) { this.eligibilityType = eligibilityType; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    
    public boolean isNeedsWheelchairAccess() { return needsWheelchairAccess; }
    public void setNeedsWheelchairAccess(boolean needsWheelchairAccess) { this.needsWheelchairAccess = needsWheelchairAccess; }
    
    public boolean isNeedsAssistance() { return needsAssistance; }
    public void setNeedsAssistance(boolean needsAssistance) { this.needsAssistance = needsAssistance; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}