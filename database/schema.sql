CREATE DATABASE IF NOT EXISTS taxi_carpooling;
USE taxi_carpooling;

-- Users table for passengers, drivers, and admins
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    personnummer VARCHAR(12) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    user_type ENUM('PASSENGER', 'DRIVER', 'ADMIN') NOT NULL,
    eligibility_type ENUM('ELDERLY', 'DISABLED', 'PATIENT', 'COMPANION'),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    needs_wheelchair_access BOOLEAN DEFAULT FALSE,
    needs_assistance BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shared trips table for grouped rides
CREATE TABLE shared_trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    assigned_driver_id BIGINT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    passenger_count INT DEFAULT 0,
    pickup_sequence TEXT,
    dropoff_sequence TEXT,
    estimated_duration_minutes INT,
    actual_duration_minutes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (assigned_driver_id) REFERENCES users(id)
);

-- Trip requests table
CREATE TABLE trip_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    pickup_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    destination_latitude DECIMAL(10, 8),
    destination_longitude DECIMAL(11, 8),
    requested_pickup_time TIMESTAMP NOT NULL,
    actual_pickup_time TIMESTAMP NULL,
    actual_dropoff_time TIMESTAMP NULL,
    status ENUM('PENDING', 'MATCHED', 'ASSIGNED', 'PICKUP_CONFIRMED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
    passenger_count INT DEFAULT 1,
    needs_wheelchair_access BOOLEAN DEFAULT FALSE,
    needs_assistance BOOLEAN DEFAULT FALSE,
    special_requirements TEXT,
    assigned_driver_id BIGINT,
    shared_trip_id BIGINT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_driver_id) REFERENCES users(id),
    FOREIGN KEY (shared_trip_id) REFERENCES shared_trips(id)
);

-- Cost savings tracking table
CREATE TABLE cost_savings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    individual_trips_count INT DEFAULT 0,
    shared_trips_count INT DEFAULT 0,
    passengers_in_shared_trips INT DEFAULT 0,
    total_individual_cost DECIMAL(12,2) DEFAULT 0,
    total_shared_cost DECIMAL(12,2) DEFAULT 0,
    total_savings DECIMAL(12,2) DEFAULT 0,
    savings_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- Driver vehicles table
CREATE TABLE driver_vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_make VARCHAR(50),
    vehicle_model VARCHAR(50),
    vehicle_year INT,
    max_passengers INT DEFAULT 4,
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- Insert sample government admin user
INSERT INTO users (personnummer, first_name, last_name, email, user_type) VALUES 
('199001011234', 'Admin', 'Gothenburg', 'admin@goteborg.se', 'ADMIN');

-- Insert sample elderly passengers
INSERT INTO users (personnummer, first_name, last_name, email, phone, user_type, eligibility_type, address, city, postal_code, needs_wheelchair_access) VALUES 
('194512151234', 'Anna', 'Andersson', 'anna.andersson@example.com', '0701234567', 'PASSENGER', 'ELDERLY', 'Götaplatsen 1', 'Göteborg', '41256', FALSE),
('194803221234', 'Erik', 'Eriksson', 'erik.eriksson@example.com', '0709876543', 'PASSENGER', 'ELDERLY', 'Avenyn 15', 'Göteborg', '41135', TRUE),
('195106101234', 'Margareta', 'Nilsson', 'margareta.nilsson@example.com', '0705551234', 'PASSENGER', 'DISABLED', 'Landvetter 5', 'Göteborg', '4381', FALSE);

-- Insert sample drivers
INSERT INTO users (personnummer, first_name, last_name, email, phone, user_type) VALUES 
('198505151234', 'Lars', 'Larsson', 'lars.larsson@taxigbg.se', '0702345678', 'DRIVER'),
('199012121234', 'Maria', 'Svensson', 'maria.svensson@taxigbg.se', '0703456789', 'DRIVER');

-- Insert sample vehicles
INSERT INTO driver_vehicles (driver_id, license_plate, vehicle_make, vehicle_model, vehicle_year, max_passengers, wheelchair_accessible) VALUES 
(4, 'ABC123', 'Volvo', 'V70', 2020, 4, FALSE),
(5, 'DEF456', 'Mercedes', 'Vito', 2021, 6, TRUE);

-- Create indexes for performance
CREATE INDEX idx_trip_requests_status ON trip_requests(status);
CREATE INDEX idx_trip_requests_pickup_time ON trip_requests(requested_pickup_time);
CREATE INDEX idx_trip_requests_user_id ON trip_requests(user_id);
CREATE INDEX idx_shared_trips_status ON shared_trips(status);
CREATE INDEX idx_users_eligibility ON users(eligibility_type);

-- Create view for government cost analysis
CREATE VIEW government_savings_summary AS
SELECT 
    DATE(tr.created_at) as trip_date,
    COUNT(CASE WHEN tr.shared_trip_id IS NULL THEN 1 END) as individual_trips,
    COUNT(CASE WHEN tr.shared_trip_id IS NOT NULL THEN 1 END) as shared_trips,
    SUM(CASE WHEN tr.shared_trip_id IS NULL THEN 650 ELSE 0 END) as individual_cost,
    SUM(CASE WHEN tr.shared_trip_id IS NOT NULL THEN tr.estimated_cost ELSE 0 END) as shared_cost,
    (SUM(CASE WHEN tr.shared_trip_id IS NULL THEN 650 ELSE 0 END) - 
     SUM(CASE WHEN tr.shared_trip_id IS NOT NULL THEN tr.estimated_cost ELSE 0 END)) as total_savings
FROM trip_requests tr
WHERE tr.status = 'COMPLETED'
GROUP BY DATE(tr.created_at);