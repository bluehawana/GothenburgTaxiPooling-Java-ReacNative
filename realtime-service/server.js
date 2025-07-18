const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const mockTestData = require('./mock-test-data');
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
      <li><a href="/test-control.html">🧪 Mock Test Control (QR Codes & 48h Simulation)</a></li>
      <li><a href="/dashboard.html">📊 Management Dashboard</a></li>
      <li><a href="/api/active-drivers">Active Drivers</a></li>
      <li><a href="/api/shared-trips">Shared Trips</a></li>
      <li><a href="/api/mock-test/orders">Mock Test Orders</a></li>
      <li><a href="/api/mock-test/patterns">Carpooling Patterns</a></li>
      <li><a href="/status">Service Status</a></li>
    </ul>
    <hr>
    <h2>🚀 Quick Test Setup</h2>
    <p>1. Open <a href="/test-control.html">Test Control</a> to get QR codes</p>
    <p>2. Scan QR codes with Android/iPhone for mobile apps</p>
    <p>3. Initialize test data with 20 orders over 48 hours</p>
    <p>4. Start simulation and test automatic/manual order management</p>
    <p>5. Monitor live tracking on the dashboard</p>
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

// Mock test data storage
let mockOrders = [];
let mockPatterns = [];
let driverConstraints = {};
let testScenarios = [];
let qrCodeContent = {};

// Driver constraint: Only one merged order per driver at a time
const driverAssignments = new Map(); // driverId -> { assignedTripId, assignedAt, status }

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('driver-connect', (data) => {
    activeDrivers.set(data.driverId, {
      socketId: socket.id,
      location: data.location,
      status: 'available',
      vehicleInfo: {
        licensePlate: data.vehicleInfo?.licensePlate || 'ABC123',
        make: data.vehicleInfo?.make || 'Volvo',
        model: data.vehicleInfo?.model || 'V70',
        color: data.vehicleInfo?.color || 'Vit',
        phoneNumber: data.vehicleInfo?.phoneNumber || '031-123-4567',
        driverName: data.vehicleInfo?.driverName || `Förare ${data.driverId}`
      },
      connectedAt: new Date()
    });
    console.log(`Driver ${data.driverId} connected with vehicle ${data.vehicleInfo?.licensePlate || 'ABC123'}`);
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
    
    // Allow first-time acceptance only
    if (driverAssignments.has(driverId)) {
      const currentAssignment = driverAssignments.get(driverId);
      if (currentAssignment.assignedTripId === sharedTripId) {
        // Already accepted this exact trip - allow but don't duplicate
        return;
      }
      if (currentAssignment.status === 'active') {
        const driverSocket = activeDrivers.get(driverId)?.socketId;
        if (driverSocket) {
          io.to(driverSocket).emit('assignment-rejected', {
            reason: 'Du har redan en aktiv resa.',
            currentTripId: currentAssignment.assignedTripId
          });
        }
        return;
      }
    }
    
    if (sharedTrips.has(sharedTripId)) {
      const sharedTrip = sharedTrips.get(sharedTripId);
      
      // Allow first-time assignment
      if (sharedTrip.status === 'ASSIGNED' && sharedTrip.assignedDriverId !== driverId) {
        const driverSocket = activeDrivers.get(driverId)?.socketId;
        if (driverSocket) {
          io.to(driverSocket).emit('assignment-rejected', {
            reason: 'Denna resa har redan tilldelats en annan förare.',
            sharedTripId: sharedTripId
          });
        }
        return;
      }
      
      sharedTrip.status = 'ASSIGNED';
      sharedTrip.assignedDriverId = driverId;
      sharedTrip.assignedAt = new Date();
      
      // Update driver status and assignment
      if (activeDrivers.has(driverId)) {
        activeDrivers.get(driverId).status = 'busy';
      }
      
      // Record driver assignment with atomic check
      if (driverAssignments.has(driverId)) {
        const driverSocket = activeDrivers.get(driverId)?.socketId;
        if (driverSocket) {
          io.to(driverSocket).emit('assignment-rejected', {
            reason: 'Du har redan en aktiv resa.',
            currentTripId: driverAssignments.get(driverId).assignedTripId
          });
        }
        return; // Stop duplicate assignment
      }
      
      driverAssignments.set(driverId, {
        assignedTripId: sharedTripId,
        assignedAt: new Date(),
        status: 'active',
        passengerCount: sharedTrip.passengerCount
      });
      
      // BROADCAST TO ALL CLIENTS (including dashboard) about trip acceptance
      io.emit('shared-trip-status-update', {
        sharedTripId: sharedTripId,
        status: 'ASSIGNED',
        driverId: driverId,
        assignedAt: new Date(),
        passengerCount: sharedTrip.passengerCount,
        trips: sharedTrip.trips
      });
      
      // Notify passengers that driver has been assigned
      sharedTrip.trips.forEach(trip => {
        const passengerSocket = passengerSockets.get(trip.userId);
        if (passengerSocket) {
          const driverInfo = activeDrivers.get(driverId)?.vehicleInfo || {};
          io.to(passengerSocket).emit('driver-assigned', {
            sharedTripId: sharedTripId,
            driverId: driverId,
            driverInfo: {
              licensePlate: driverInfo.licensePlate || 'GTB789',
              phoneNumber: driverInfo.phoneNumber || '031-123-4567',
              make: driverInfo.make || 'Volvo',
              model: driverInfo.model || 'V70',
              color: driverInfo.color || 'Vit'
            },
            estimatedArrival: 'Beräknar ankomst...',
            message: `Din resa har matchats! Förare ${driverId} kommer att hämta dig vid ${trip.pickupAddress}`
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
  
  socket.on('driver-pickup-confirmed', (data) => {
    const { sharedTripId, driverId, estimatedArrival, driverInfo } = data;
    
    if (sharedTrips.has(sharedTripId)) {
      const sharedTrip = sharedTrips.get(sharedTripId);
      sharedTrip.status = 'PICKUP_CONFIRMED';
      sharedTrip.pickupConfirmedAt = new Date();
      sharedTrip.estimatedArrival = estimatedArrival;
      
      // Broadcast detailed status to all parties
      io.emit('trip-status-update', {
        sharedTripId: sharedTripId,
        status: 'pickup_confirmed',
        driverId: driverId,
        driverInfo: driverInfo,
        estimatedArrival: estimatedArrival,
        message: `Föraren är på väg! Beräknad ankomst: ${estimatedArrival}`,
        timestamp: new Date()
      });
      
      // Notify specific passengers with detailed info
      sharedTrip.trips.forEach(trip => {
        const passengerSocket = passengerSockets.get(trip.userId);
        if (passengerSocket) {
          io.to(passengerSocket).emit('detailed-trip-update', {
            sharedTripId: sharedTripId,
            status: 'pickup_confirmed',
            message: `Hej ${trip.userName || 'kund'}! Din förare är på väg till ${trip.pickupAddress}. Beräknad ankomst: ${estimatedArrival}`,
            driverInfo: {
              licensePlate: driverInfo.licensePlate,
              phoneNumber: driverInfo.phoneNumber,
              vehicleModel: `${driverInfo.make} ${driverInfo.model}`
            },
            pickupTime: estimatedArrival,
            pickupAddress: trip.pickupAddress
          });
        }
      });
      
      console.log(`Driver ${driverId} confirmed pickup for shared trip ${sharedTripId}`);
    }
  });
  
  socket.on('driver-arrived', (data) => {
    const { sharedTripId, driverId, driverInfo } = data;
    
    if (sharedTrips.has(sharedTripId)) {
      const sharedTrip = sharedTrips.get(sharedTripId);
      sharedTrip.status = 'DRIVER_ARRIVED';
      sharedTrip.arrivedAt = new Date();
      
      // Broadcast to all parties
      io.emit('trip-status-update', {
        sharedTripId: sharedTripId,
        status: 'arrived',
        driverId: driverId,
        message: 'Föraren har anlänt!',
        timestamp: new Date()
      });
      
      // Notify passengers with detailed info
      sharedTrip.trips.forEach(trip => {
        const passengerSocket = passengerSockets.get(trip.userId);
        if (passengerSocket) {
          io.to(passengerSocket).emit('detailed-trip-update', {
            sharedTripId: sharedTripId,
            status: 'arrived',
            message: `Din förare har anlänt vid ${trip.pickupAddress}! Titta efter bilen med registreringsnummer ${driverInfo.licensePlate}`,
            driverInfo: {
              licensePlate: driverInfo.licensePlate,
              phoneNumber: driverInfo.phoneNumber,
              vehicleModel: `${driverInfo.make} ${driverInfo.model}`
            }
          });
        }
      });
    }
  });
  
  socket.on('trip-started', (data) => {
    const { sharedTripId, driverId } = data;
    
    if (sharedTrips.has(sharedTripId)) {
      const sharedTrip = sharedTrips.get(sharedTripId);
      sharedTrip.status = 'IN_PROGRESS';
      sharedTrip.startedAt = new Date();
      
      // Broadcast to all parties
      io.emit('trip-status-update', {
        sharedTripId: sharedTripId,
        status: 'in_progress',
        driverId: driverId,
        message: 'Resan har påbörjats',
        timestamp: new Date()
      });
      
      // Notify passengers
      sharedTrip.trips.forEach(trip => {
        const passengerSocket = passengerSockets.get(trip.userId);
        if (passengerSocket) {
          io.to(passengerSocket).emit('detailed-trip-update', {
            sharedTripId: sharedTripId,
            status: 'in_progress',
            message: `Resan till ${trip.destinationAddress} pågår. Ha en trevlig resa!`
          });
        }
      });
    }
  });
  
  socket.on('trip-completed', (data) => {
    const { sharedTripId, driverId } = data;
    
    if (sharedTrips.has(sharedTripId)) {
      const sharedTrip = sharedTrips.get(sharedTripId);
      sharedTrip.status = 'COMPLETED';
      sharedTrip.completedAt = new Date();
      
      // Update driver status to available and clear assignment
      if (activeDrivers.has(driverId)) {
        activeDrivers.get(driverId).status = 'available';
      }
      
      // Clear driver assignment so they can take new orders
      if (driverAssignments.has(driverId)) {
        driverAssignments.delete(driverId);
      }
      
      // Broadcast to all parties
      io.emit('trip-status-update', {
        sharedTripId: sharedTripId,
        status: 'completed',
        driverId: driverId,
        message: 'Resan avslutad',
        timestamp: new Date()
      });
      
      // Notify passengers
      sharedTrip.trips.forEach(trip => {
        const passengerSocket = passengerSockets.get(trip.userId);
        if (passengerSocket) {
          io.to(passengerSocket).emit('detailed-trip-update', {
            sharedTripId: sharedTripId,
            status: 'completed',
            message: 'Tack för att du reste med Göteborg Taxi! Vi hoppas du hade en bra resa.'
          });
        }
      });
      
      console.log(`Trip ${sharedTripId} completed by driver ${driverId}. Driver now available for new assignments.`);
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
    assignedDriverId: trip.assignedDriverId,
    assignedAt: trip.assignedAt,
    createdAt: trip.createdAt,
    pickupAddresses: trip.trips.map(t => t.pickupAddress),
    destinationAddresses: trip.trips.map(t => t.destinationAddress)
  }));
  
  res.json(trips);
});

app.get('/api/pending-orders', async (req, res) => {
  try {
    // Get pending orders from backend
    const response = await axios.get(`${SPRING_BOOT_API}/api/trips/pending`);
    const pendingTrips = response.data;
    
    // Return formatted data for dashboard
    const formattedTrips = pendingTrips.map(trip => ({
      id: trip.id,
      userId: trip.user.id,
      userName: `${trip.user.firstName} ${trip.user.lastName}`,
      pickupAddress: trip.pickupAddress,
      destinationAddress: trip.destinationAddress,
      requestedPickupTime: trip.requestedPickupTime,
      status: trip.status,
      passengerCount: trip.passengerCount,
      estimatedCost: trip.estimatedCost,
      createdAt: trip.createdAt,
      priority: trip.priority,
      needsWheelchairAccess: trip.needsWheelchairAccess,
      needsAssistance: trip.needsAssistance
    }));
    
    res.json(formattedTrips);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

// Manual merge endpoint
app.post('/api/manual-merge', async (req, res) => {
  const { orderIds, mergedBy, timestamp } = req.body;
  
  try {
    // In a real application, you would fetch the actual trip data from the database
    // For now, we'll create a mock shared trip
    const sharedTripId = 'manual-' + Date.now();
    
    console.log(`Manual merge requested by ${mergedBy} for orders: ${orderIds.join(', ')}`);
    
    // Create a shared trip with the manually merged orders
    const mockTrips = orderIds.map(orderId => ({
      id: orderId,
      userId: orderId,
      userName: `Kund ${orderId}`,
      pickupAddress: `Upphämtningsplats ${orderId}`,
      destinationAddress: `Destination ${orderId}`,
      passengerCount: 1,
      estimatedCost: 400
    }));
    
    sharedTrips.set(sharedTripId, {
      id: sharedTripId,
      trips: mockTrips,
      passengerCount: mockTrips.reduce((sum, trip) => sum + trip.passengerCount, 0),
      status: 'PENDING_DRIVER_ASSIGNMENT',
      createdAt: new Date(),
      mergedManually: true,
      mergedBy: mergedBy
    });
    
    // Notify all active drivers about the new shared trip
    const availableDrivers = Array.from(activeDrivers.entries())
      .filter(([id, data]) => data.status === 'available');
    
    availableDrivers.forEach(([driverId, driverData]) => {
      io.to(driverData.socketId).emit('shared-trip-available', {
        sharedTripId: sharedTripId,
        trips: mockTrips,
        passengerCount: mockTrips.reduce((sum, trip) => sum + trip.passengerCount, 0),
        estimatedEarning: 800,
        pickupAddresses: mockTrips.map(trip => trip.pickupAddress),
        destinationAddresses: mockTrips.map(trip => trip.destinationAddress),
        manuallyMerged: true
      });
    });
    
    res.json({ 
      success: true, 
      sharedTripId: sharedTripId,
      notifiedDrivers: availableDrivers.length 
    });
    
  } catch (error) {
    console.error('Error in manual merge:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Send individual trips endpoint
app.post('/api/send-individual', async (req, res) => {
  const { orderIds, sentBy, timestamp } = req.body;
  
  try {
    console.log(`Individual trips sent by ${sentBy} for orders: ${orderIds.join(', ')}`);
    
    // Create individual trips for each order
    orderIds.forEach(orderId => {
      const individualTripId = 'individual-' + orderId + '-' + Date.now();
      
      const mockTrip = {
        id: individualTripId,
        userId: orderId,
        userName: `Kund ${orderId}`,
        pickupAddress: `Upphämtningsplats ${orderId}`,
        destinationAddress: `Destination ${orderId}`,
        passengerCount: 1,
        estimatedCost: 650
      };
      
      // Create individual shared trip (with just one trip)
      sharedTrips.set(individualTripId, {
        id: individualTripId,
        trips: [mockTrip],
        passengerCount: 1,
        status: 'PENDING_DRIVER_ASSIGNMENT',
        createdAt: new Date(),
        sentIndividually: true,
        sentBy: sentBy
      });
      
      // Notify all active drivers about the individual trip
      const availableDrivers = Array.from(activeDrivers.entries())
        .filter(([id, data]) => data.status === 'available');
      
      availableDrivers.forEach(([driverId, driverData]) => {
        io.to(driverData.socketId).emit('shared-trip-available', {
          sharedTripId: individualTripId,
          trips: [mockTrip],
          passengerCount: 1,
          estimatedEarning: 650,
          pickupAddresses: [mockTrip.pickupAddress],
          destinationAddresses: [mockTrip.destinationAddress],
          individualTrip: true
        });
      });
    });
    
    res.json({ 
      success: true, 
      individualTripsCreated: orderIds.length
    });
    
  } catch (error) {
    console.error('Error sending individual trips:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Mock test endpoints
app.get('/api/mock-test/initialize', (req, res) => {
  console.log('Initializing mock test data...');
  
  // Generate mock data
  mockOrders = mockTestData.generateMockOrders();
  mockPatterns = mockTestData.generateCarpoolingPatterns(mockOrders);
  driverConstraints = mockTestData.enforceDriverConstraints();
  testScenarios = mockTestData.generateTestScenarios();
  qrCodeContent = mockTestData.generateQRCodeContent();
  
  // Clear existing data
  sharedTrips.clear();
  driverAssignments.clear();
  
  res.json({
    success: true,
    message: 'Mock test data initialized successfully',
    data: {
      ordersGenerated: mockOrders.length,
      patterns: mockPatterns.length,
      scenarios: testScenarios.length,
      timeSpan: '48 hours',
      driverConstraints: driverConstraints.rules
    }
  });
});

app.get('/api/mock-test/orders', (req, res) => {
  res.json({
    orders: mockOrders,
    total: mockOrders.length,
    timeSpan: '48 hours'
  });
});

app.get('/api/mock-test/patterns', (req, res) => {
  res.json({
    patterns: mockPatterns,
    description: 'Different carpooling patterns for flexible pickup/delivery'
  });
});

app.get('/api/mock-test/scenarios', (req, res) => {
  res.json({
    scenarios: testScenarios,
    description: 'Test scenarios spread over 48 hours'
  });
});

app.get('/api/mock-test/qr-codes', (req, res) => {
  res.json({
    qrCodes: qrCodeContent,
    description: 'QR codes for easy mobile testing'
  });
});

app.get('/api/mock-test/driver-constraints', (req, res) => {
  res.json({
    constraints: driverConstraints,
    assignments: Array.from(driverAssignments.entries()).map(([driverId, assignment]) => ({
      driverId,
      ...assignment
    }))
  });
});

// Simulate automatic order creation over 48 hours
app.post('/api/mock-test/simulate', (req, res) => {
  const { speedMultiplier = 1 } = req.body;
  
  console.log(`Starting 48-hour simulation with ${speedMultiplier}x speed...`);
  
  // Process orders in chronological order
  let orderIndex = 0;
  
  const processNextOrder = () => {
    if (orderIndex >= mockOrders.length) {
      console.log('All mock orders processed');
      return;
    }
    
    const order = mockOrders[orderIndex];
    const now = new Date();
    const orderTime = new Date(order.requestedPickupTime);
    const timeDiff = orderTime - now;
    
    // Adjust timing based on speed multiplier
    const adjustedDelay = Math.max(0, timeDiff / speedMultiplier);
    
    setTimeout(() => {
      console.log(`Processing order ${order.id}: ${order.userName} from ${order.pickupAddress}`);
      
      // Try automatic matching first
      const compatibleOrders = findCompatibleOrders(order);
      
      if (compatibleOrders.length > 0) {
        // Create shared trip
        const sharedTripId = `auto-${Date.now()}-${order.id}`;
        const tripsToMerge = [order, ...compatibleOrders];
        
        createSharedTrip(sharedTripId, tripsToMerge, 'automatic');
      } else {
        // Add to unmatched orders for manual processing
        console.log(`Order ${order.id} could not be automatically matched`);
      }
      
      orderIndex++;
      processNextOrder();
    }, adjustedDelay);
  };
  
  processNextOrder();
  
  res.json({
    success: true,
    message: `48-hour simulation started with ${speedMultiplier}x speed`,
    totalOrders: mockOrders.length,
    estimatedDuration: `${48 / speedMultiplier} hours`
  });
});

// Helper function to find compatible orders
function findCompatibleOrders(baseOrder) {
  const compatible = [];
  const maxDistance = 5; // km
  const maxTimeDiff = 30; // minutes
  
  for (const order of mockOrders) {
    if (order.id === baseOrder.id) continue;
    
    // Check time compatibility
    const timeDiff = Math.abs(new Date(order.requestedPickupTime) - new Date(baseOrder.requestedPickupTime));
    if (timeDiff > maxTimeDiff * 60 * 1000) continue;
    
    // Check geographic compatibility (simplified)
    const distance = calculateDistance(
      baseOrder.pickupLatitude, baseOrder.pickupLongitude,
      order.pickupLatitude, order.pickupLongitude
    );
    
    if (distance <= maxDistance) {
      compatible.push(order);
    }
  }
  
  return compatible.slice(0, 3); // Max 3 additional orders
}

// Helper function to calculate distance (simplified)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to create shared trip
function createSharedTrip(sharedTripId, orders, creationType) {
  const totalPassengers = orders.reduce((sum, order) => sum + order.passengerCount, 0);
  
  sharedTrips.set(sharedTripId, {
    id: sharedTripId,
    trips: orders,
    passengerCount: totalPassengers,
    status: 'PENDING_DRIVER_ASSIGNMENT',
    createdAt: new Date(),
    creationType: creationType
  });
  
  // Notify available drivers
  const availableDrivers = Array.from(activeDrivers.entries())
    .filter(([id, data]) => data.status === 'available' && !driverAssignments.has(id));
  
  availableDrivers.forEach(([driverId, driverData]) => {
    io.to(driverData.socketId).emit('shared-trip-available', {
      sharedTripId: sharedTripId,
      trips: orders,
      passengerCount: totalPassengers,
      estimatedEarning: totalPassengers > 1 ? 800 : 650,
      pickupAddresses: orders.map(order => order.pickupAddress),
      destinationAddresses: orders.map(order => order.destinationAddress),
      creationType: creationType
    });
  });
  
  console.log(`Created ${creationType} shared trip ${sharedTripId} with ${orders.length} orders`);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Gothenburg Taxi Real-time Service running on port ${PORT}`);
});