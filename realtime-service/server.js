const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Add a root route
app.get('/', (req, res) => {
  res.send(`
    <h1>Gothenburg Taxi Real-time Service</h1>
    <p>Service is running on port 3001</p>
    <ul>
      <li><a href="/api/active-drivers">Active Drivers</a></li>
      <li><a href="/api/shared-trips">Shared Trips</a></li>
      <li><a href="/status">Service Status</a></li>
      <li><a href="/dashboard.html">Management Dashboard</a></li>
    </ul>
  `);
});

app.get('/status', (req, res) => {
  res.json({
    service: 'Gothenburg Taxi Real-time Service',
    status: 'running',
    activeDrivers: activeDrivers.size,
    activeTrips: activeTrips.size,
    sharedTrips: sharedTrips.size,
    connectedPassengers: passengerSockets.size
  });
});

const SPRING_BOOT_API = process.env.SPRING_BOOT_API || 'http://localhost:8081';

const activeDrivers = new Map();
const activeTrips = new Map();
const sharedTrips = new Map();
const passengerSockets = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('driver-connect', (data) => {
    activeDrivers.set(data.driverId, {
      socketId: socket.id,
      location: data.location,
      status: 'available',
      vehicleInfo: data.vehicleInfo
    });
    console.log(`Driver ${data.driverId} connected`);
  });
  
  socket.on('passenger-connect', (data) => {
    passengerSockets.set(data.userId, socket.id);
    console.log(`Passenger ${data.userId} connected`);
  });
  
  socket.on('location-update', (data) => {
    if (activeDrivers.has(data.driverId)) {
      const driver = activeDrivers.get(data.driverId);
      driver.location = data.location;
      driver.lastLocationUpdate = new Date();
      
      // Broadcast to all management dashboards
      socket.broadcast.emit('driver-location-update', {
        driverId: data.driverId,
        location: data.location,
        status: driver.status,
        vehicleInfo: driver.vehicleInfo,
        timestamp: new Date()
      });
      
      // Update trip progress for assigned trips
      updateTripProgress(data.driverId, data.location);
      
      // If driver is in a shared trip, update all passengers
      for (let [sharedTripId, sharedTrip] of sharedTrips.entries()) {
        if (sharedTrip.assignedDriverId === data.driverId && sharedTrip.status === 'ASSIGNED') {
          sharedTrip.trips.forEach(trip => {
            const passengerSocket = passengerSockets.get(trip.userId);
            if (passengerSocket) {
              io.to(passengerSocket).emit('driver-location-update', {
                sharedTripId: sharedTripId,
                driverId: data.driverId,
                location: data.location,
                timestamp: new Date()
              });
            }
          });
        }
      }
    }
  });
  
  socket.on('trip-status-update', (data) => {
    updateTripStatus(data.tripId, data.status, data.driverId);
  });
  
  socket.on('shared-trip-accept', (data) => {
    const { sharedTripId, driverId } = data;
    
    if (sharedTrips.has(sharedTripId)) {
      const sharedTrip = sharedTrips.get(sharedTripId);
      sharedTrip.status = 'ASSIGNED';
      sharedTrip.assignedDriverId = driverId;
      sharedTrip.assignedAt = new Date();
      
      // Update driver status
      if (activeDrivers.has(driverId)) {
        activeDrivers.get(driverId).status = 'busy';
      }
      
      // Notify passengers that driver has been assigned
      sharedTrip.trips.forEach(trip => {
        const passengerSocket = passengerSockets.get(trip.userId);
        if (passengerSocket) {
          io.to(passengerSocket).emit('driver-assigned', {
            sharedTripId: sharedTripId,
            driverId: driverId,
            driverInfo: activeDrivers.get(driverId)?.vehicleInfo,
            estimatedArrival: 'Calculating...'
          });
        }
      });
      
      // Notify other drivers that this trip is no longer available
      const otherDrivers = Array.from(activeDrivers.entries())
        .filter(([id, data]) => id !== driverId && data.status === 'available');
      
      otherDrivers.forEach(([otherDriverId, driverData]) => {
        io.to(driverData.socketId).emit('shared-trip-taken', {
          sharedTripId: sharedTripId
        });
      });
      
      console.log(`Driver ${driverId} accepted shared trip ${sharedTripId}`);
    }
  });
  
  socket.on('passenger-pickup-confirmed', (data) => {
    notifyPassengers(data.tripId, 'pickup-confirmed', {
      estimatedArrival: data.estimatedArrival,
      driverLocation: data.driverLocation
    });
  });
  
  socket.on('disconnect', () => {
    for (let [driverId, driverData] of activeDrivers.entries()) {
      if (driverData.socketId === socket.id) {
        activeDrivers.delete(driverId);
        console.log(`Driver ${driverId} disconnected`);
        break;
      }
    }
    
    for (let [userId, socketId] of passengerSockets.entries()) {
      if (socketId === socket.id) {
        passengerSockets.delete(userId);
        console.log(`Passenger ${userId} disconnected`);
        break;
      }
    }
  });
});

function updateTripProgress(driverId, location) {
  for (let [tripId, tripData] of activeTrips.entries()) {
    if (tripData.driverId === driverId) {
      const estimatedArrival = calculateETA(location, tripData.pickupLocations);
      
      tripData.passengers.forEach(passengerId => {
        const passengerSocket = passengerSockets.get(passengerId);
        if (passengerSocket) {
          io.to(passengerSocket).emit('trip-update', {
            tripId,
            driverLocation: location,
            estimatedArrival,
            status: 'en_route'
          });
        }
      });
    }
  }
}

function updateTripStatus(tripId, status, driverId) {
  if (activeTrips.has(tripId)) {
    const tripData = activeTrips.get(tripId);
    tripData.status = status;
    
    axios.put(`${SPRING_BOOT_API}/api/trips/${tripId}/status`, {
      status: status,
      driverId: driverId
    }).catch(error => {
      console.error('Error updating trip status in backend:', error);
    });
    
    notifyPassengers(tripId, 'status-update', { status });
  }
}

function notifyPassengers(tripId, eventType, data) {
  if (activeTrips.has(tripId)) {
    const tripData = activeTrips.get(tripId);
    tripData.passengers.forEach(passengerId => {
      const passengerSocket = passengerSockets.get(passengerId);
      if (passengerSocket) {
        io.to(passengerSocket).emit(eventType, {
          tripId,
          ...data
        });
      }
    });
  }
}

function calculateETA(currentLocation, destinations) {
  return Math.floor(Math.random() * 15) + 5;
}

app.post('/api/trip-assigned', (req, res) => {
  const { tripId, driverId, passengers, pickupLocations } = req.body;
  
  activeTrips.set(tripId, {
    driverId,
    passengers,
    pickupLocations,
    status: 'assigned'
  });
  
  const driverSocket = activeDrivers.get(driverId)?.socketId;
  if (driverSocket) {
    io.to(driverSocket).emit('trip-assignment', {
      tripId,
      passengers,
      pickupLocations
    });
  }
  
  notifyPassengers(tripId, 'trip-assigned', {
    driverId,
    estimatedArrival: 'Calculating...'
  });
  
  res.json({ success: true });
});

app.get('/api/active-drivers', (req, res) => {
  const drivers = Array.from(activeDrivers.entries()).map(([id, data]) => ({
    driverId: id,
    location: data.location,
    status: data.status,
    vehicleInfo: data.vehicleInfo
  }));
  
  res.json(drivers);
});

app.post('/api/shared-trip-created', (req, res) => {
  const { sharedTripId, trips, passengerCount } = req.body;
  
  console.log(`New shared trip created: ${sharedTripId} with ${passengerCount} passengers`);
  
  sharedTrips.set(sharedTripId, {
    id: sharedTripId,
    trips: trips,
    passengerCount: passengerCount,
    status: 'PENDING_DRIVER_ASSIGNMENT',
    createdAt: new Date()
  });
  
  // Notify all active drivers about the new shared trip
  const availableDrivers = Array.from(activeDrivers.entries())
    .filter(([id, data]) => data.status === 'available');
  
  availableDrivers.forEach(([driverId, driverData]) => {
    io.to(driverData.socketId).emit('shared-trip-available', {
      sharedTripId: sharedTripId,
      trips: trips,
      passengerCount: passengerCount,
      estimatedEarning: 800, // Government rate for shared trips
      pickupAddresses: trips.map(trip => trip.pickupAddress),
      destinationAddresses: trips.map(trip => trip.destinationAddress)
    });
  });
  
  res.json({ success: true, notifiedDrivers: availableDrivers.length });
});

app.get('/api/shared-trips', (req, res) => {
  const trips = Array.from(sharedTrips.values()).map(trip => ({
    id: trip.id,
    passengerCount: trip.passengerCount,
    status: trip.status,
    createdAt: trip.createdAt,
    pickupAddresses: trip.trips.map(t => t.pickupAddress),
    destinationAddresses: trip.trips.map(t => t.destinationAddress)
  }));
  
  res.json(trips);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Gothenburg Taxi Real-time Service running on port ${PORT}`);
});