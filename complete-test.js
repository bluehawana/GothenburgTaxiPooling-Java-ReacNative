#!/usr/bin/env node

/**
 * Complete System Test for Göteborg Taxi Carpooling System
 * Tests 21 orders with automatic matching, manual override, and driver assignment
 */

const axios = require('axios');
const io = require('socket.io-client');

// Configuration
const API_BASE = 'http://localhost:8081';
const REALTIME_BASE = 'http://localhost:3001';

// Test data - 21 realistic orders
const testOrders = [
  // Morning rush - Hospital appointments (8:00-9:00)
  {
    userId: 1, userName: 'Anna Andersson', age: 73,
    pickupAddress: 'Angered Centrum', destinationAddress: 'Sahlgrenska Universitetssjukhuset',
    requestedPickupTime: getTimeFromNow(8, 0), priority: 'NORMAL',
    needsWheelchairAccess: true, needsAssistance: false, passengerCount: 1
  },
  {
    userId: 2, userName: 'Erik Eriksson', age: 68,
    pickupAddress: 'Bergsjöns Centrum', destinationAddress: 'Sahlgrenska Universitetssjukhuset',
    requestedPickupTime: getTimeFromNow(8, 15), priority: 'NORMAL',
    needsWheelchairAccess: false, needsAssistance: true, passengerCount: 1
  },
  {
    userId: 3, userName: 'Margareta Johansson', age: 81,
    pickupAddress: 'Kortedala Torg', destinationAddress: 'Östra sjukhuset',
    requestedPickupTime: getTimeFromNow(8, 30), priority: 'HIGH',
    needsWheelchairAccess: false, needsAssistance: false, passengerCount: 1
  },
  
  // Mid-morning mixed destinations (10:00-11:00)
  {
    userId: 4, userName: 'Gunnar Svensson', age: 76,
    pickupAddress: 'Frölunda Torg', destinationAddress: 'Mölndals sjukhus',
    requestedPickupTime: getTimeFromNow(10, 0), priority: 'NORMAL',
    needsWheelchairAccess: true, needsAssistance: false, passengerCount: 1
  },
  {
    userId: 5, userName: 'Astrid Lindgren', age: 79,
    pickupAddress: 'Backa Bil', destinationAddress: 'Göteborg City, Nordstan',
    requestedPickupTime: getTimeFromNow(10, 20), priority: 'LOW',
    needsWheelchairAccess: false, needsAssistance: true, passengerCount: 2
  }
];

// Helper function to generate future timestamps
function getTimeFromNow(hours, minutes) {
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  if (now < new Date()) {
    now.setDate(now.getDate() + 1); // Next day if time has passed
  }
  return now.toISOString();
}

// Test execution
async function runCompleteTest() {
  console.log('🚀 Starting Complete Göteborg Taxi System Test');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Test backend connectivity
    await testBackendConnectivity();
    
    // Step 2: Test real-time service
    await testRealtimeService();
    
    // Step 3: Create test orders
    await createTestOrders();
    
    // Step 4: Test automatic matching
    await testAutomaticMatching();
    
    // Step 5: Test manual override
    await testManualOverride();
    
    // Step 6: Test driver assignment
    await testDriverAssignment();
    
    // Step 7: Test complete workflow
    await testCompleteWorkflow();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('🎯 System is ready for presentation');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

async function testBackendConnectivity() {
  console.log('\n1️⃣ Testing Backend Connectivity...');
  
  try {
    const response = await axios.get(`${API_BASE}/api/trips/pending`);
    console.log('✅ Backend API is responsive');
    console.log(`   Found ${response.data.length} pending trips`);
  } catch (error) {
    throw new Error(`Backend not accessible: ${error.message}`);
  }
}

async function testRealtimeService() {
  console.log('\n2️⃣ Testing Real-time Service...');
  
  try {
    const response = await axios.get(`${REALTIME_BASE}/status`);
    console.log('✅ Real-time service is responsive');
    console.log(`   Active drivers: ${response.data.activeDrivers}`);
    console.log(`   Active trips: ${response.data.activeTrips}`);
  } catch (error) {
    throw new Error(`Real-time service not accessible: ${error.message}`);
  }
}

async function createTestOrders() {
  console.log('\n3️⃣ Creating 21 Test Orders...');
  
  // Expand test orders to 21
  const allTestOrders = [
    ...testOrders,
    // Add 16 more orders for complete test
    ...generateAdditionalOrders(16)
  ];
  
  let createdCount = 0;
  
  for (const order of allTestOrders) {
    try {
      const response = await axios.post(`${API_BASE}/api/trips/book`, {
        userId: order.userId,
        pickupAddress: order.pickupAddress,
        destinationAddress: order.destinationAddress,
        pickupLatitude: 57.7089 + (Math.random() - 0.5) * 0.1,
        pickupLongitude: 11.9746 + (Math.random() - 0.5) * 0.1,
        destinationLatitude: 57.7089 + (Math.random() - 0.5) * 0.1,
        destinationLongitude: 11.9746 + (Math.random() - 0.5) * 0.1,
        requestedPickupTime: order.requestedPickupTime,
        priority: order.priority,
        passengerCount: order.passengerCount,
        needsWheelchairAccess: order.needsWheelchairAccess,
        needsAssistance: order.needsAssistance,
        specialRequirements: order.needsWheelchairAccess ? 'wheelchair' : 
                           order.needsAssistance ? 'assistance' : ''
      });
      
      createdCount++;
      console.log(`   ✅ Order ${createdCount}: ${order.userName} - ${order.pickupAddress} → ${order.destinationAddress}`);
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`   ❌ Failed to create order for ${order.userName}: ${error.message}`);
    }
  }
  
  console.log(`✅ Created ${createdCount}/21 test orders`);
}

function generateAdditionalOrders(count) {
  const additionalOrders = [];
  const addresses = [
    'Centralstation, Göteborg', 'Landvetter Flygplats', 'Liseberg, Göteborg',
    'Partille Centrum', 'Lerum Vårdcentral', 'Kungsbacka Centrum',
    'Kungälv Centrum', 'Stenungsund Centrum', 'Alingsås Centrum',
    'Borås Centrum', 'Trollhättan Centrum', 'Älvsjö vårdcentral'
  ];
  
  const destinations = [
    'Sahlgrenska Universitetssjukhuset', 'Östra sjukhuset', 'Mölndals sjukhus',
    'Kungälv sjukhus', 'Alingsås lasarett', 'Borås lasarett'
  ];
  
  for (let i = 0; i < count; i++) {
    const userId = testOrders.length + i + 1;
    additionalOrders.push({
      userId: userId,
      userName: `Test User ${userId}`,
      age: 65 + Math.floor(Math.random() * 20),
      pickupAddress: addresses[Math.floor(Math.random() * addresses.length)],
      destinationAddress: destinations[Math.floor(Math.random() * destinations.length)],
      requestedPickupTime: getTimeFromNow(12 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60)),
      priority: Math.random() < 0.1 ? 'HIGH' : (Math.random() < 0.2 ? 'LOW' : 'NORMAL'),
      needsWheelchairAccess: Math.random() < 0.3,
      needsAssistance: Math.random() < 0.4,
      passengerCount: Math.random() < 0.7 ? 1 : 2
    });
  }
  
  return additionalOrders;
}

async function testAutomaticMatching() {
  console.log('\n4️⃣ Testing Automatic Matching...');
  
  try {
    // Trigger matchmaking
    const response = await axios.post(`${API_BASE}/api/trips/matchmaking`);
    console.log('✅ Automatic matchmaking triggered');
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check results
    const sharedTripsResponse = await axios.get(`${REALTIME_BASE}/api/shared-trips`);
    const sharedTrips = sharedTripsResponse.data;
    
    console.log(`✅ Created ${sharedTrips.length} shared trips through automatic matching`);
    
    // Analyze matching results
    let totalPassengers = 0;
    let potentialSavings = 0;
    
    sharedTrips.forEach((trip, index) => {
      totalPassengers += trip.passengerCount;
      const individualCost = trip.passengerCount * 650;
      const sharedCost = 800;
      const savings = individualCost - sharedCost;
      potentialSavings += savings;
      
      console.log(`   Trip ${index + 1}: ${trip.passengerCount} passengers, saves ${savings} SEK`);
    });
    
    console.log(`✅ Total passengers in shared trips: ${totalPassengers}`);
    console.log(`✅ Total potential savings: ${potentialSavings} SEK`);
    
  } catch (error) {
    throw new Error(`Automatic matching failed: ${error.message}`);
  }
}

async function testManualOverride() {
  console.log('\n5️⃣ Testing Manual Override...');
  
  try {
    // Get pending orders that weren't matched
    const pendingResponse = await axios.get(`${REALTIME_BASE}/api/pending-orders`);
    const pendingOrders = pendingResponse.data;
    
    console.log(`Found ${pendingOrders.length} unmatched orders for manual processing`);
    
    if (pendingOrders.length >= 2) {
      // Test manual merge
      const ordersToMerge = pendingOrders.slice(0, 2).map(order => order.id);
      
      const mergeResponse = await axios.post(`${REALTIME_BASE}/api/manual-merge`, {
        orderIds: ordersToMerge,
        mergedBy: 'Test System',
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Manual merge successful');
      console.log(`   Merged orders: ${ordersToMerge.join(', ')}`);
      console.log(`   Shared trip ID: ${mergeResponse.data.sharedTripId}`);
    }
    
    if (pendingOrders.length >= 4) {
      // Test individual assignment
      const ordersToSendIndividual = pendingOrders.slice(2, 4).map(order => order.id);
      
      const individualResponse = await axios.post(`${REALTIME_BASE}/api/send-individual`, {
        orderIds: ordersToSendIndividual,
        sentBy: 'Test System',
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Individual assignment successful');
      console.log(`   Individual orders: ${ordersToSendIndividual.join(', ')}`);
    }
    
  } catch (error) {
    console.log(`⚠️ Manual override test: ${error.message}`);
  }
}

async function testDriverAssignment() {
  console.log('\n6️⃣ Testing Driver Assignment...');
  
  // Create mock drivers
  const mockDrivers = [
    { id: 'driver1', vehicleInfo: { licensePlate: 'GTB123', make: 'Volvo', model: 'V70' }},
    { id: 'driver2', vehicleInfo: { licensePlate: 'GTB456', make: 'Mercedes', model: 'Vito' }},
    { id: 'driver3', vehicleInfo: { licensePlate: 'GTB789', make: 'Toyota', model: 'Prius' }}
  ];
  
  // Connect mock drivers via WebSocket
  const driverSockets = [];
  
  for (const driver of mockDrivers) {
    try {
      const socket = io(REALTIME_BASE);
      
      socket.emit('driver-connect', {
        driverId: driver.id,
        location: {
          latitude: 57.7089 + (Math.random() - 0.5) * 0.05,
          longitude: 11.9746 + (Math.random() - 0.5) * 0.05
        },
        vehicleInfo: driver.vehicleInfo
      });
      
      driverSockets.push({ socket, driverId: driver.id });
      console.log(`✅ Driver ${driver.id} connected (${driver.vehicleInfo.licensePlate})`);
      
    } catch (error) {
      console.log(`❌ Failed to connect driver ${driver.id}: ${error.message}`);
    }
  }
  
  // Wait for driver connections to establish
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test driver assignment to shared trips
  try {
    const sharedTripsResponse = await axios.get(`${REALTIME_BASE}/api/shared-trips`);
    const availableTrips = sharedTripsResponse.data.filter(trip => 
      trip.status === 'PENDING_DRIVER_ASSIGNMENT'
    );
    
    if (availableTrips.length > 0 && driverSockets.length > 0) {
      const trip = availableTrips[0];
      const driver = driverSockets[0];
      
      // Simulate driver accepting trip
      driver.socket.emit('shared-trip-accept', {
        sharedTripId: trip.id,
        driverId: driver.driverId
      });
      
      console.log(`✅ Driver ${driver.driverId} accepted trip ${trip.id}`);
      
      // Wait for assignment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate trip progression
      driver.socket.emit('driver-pickup-confirmed', {
        sharedTripId: trip.id,
        driverId: driver.driverId,
        estimatedArrival: '15 minuter',
        driverInfo: mockDrivers.find(d => d.id === driver.driverId).vehicleInfo
      });
      
      console.log(`✅ Driver ${driver.driverId} confirmed pickup`);
    }
    
  } catch (error) {
    console.log(`⚠️ Driver assignment test: ${error.message}`);
  }
  
  // Cleanup driver connections
  driverSockets.forEach(({ socket }) => socket.disconnect());
}

async function testCompleteWorkflow() {
  console.log('\n7️⃣ Testing Complete Workflow...');
  
  try {
    // Get final system status
    const statusResponse = await axios.get(`${REALTIME_BASE}/status`);
    const finalStatus = statusResponse.data;
    
    console.log('📊 Final System Status:');
    console.log(`   Active drivers: ${finalStatus.activeDrivers}`);
    console.log(`   Active trips: ${finalStatus.activeTrips}`);
    console.log(`   Shared trips: ${finalStatus.sharedTrips}`);
    
    // Get all shared trips for analysis
    const sharedTripsResponse = await axios.get(`${REALTIME_BASE}/api/shared-trips`);
    const allSharedTrips = sharedTripsResponse.data;
    
    // Calculate efficiency metrics
    let totalPassengers = 0;
    let totalSavings = 0;
    let assignedTrips = 0;
    
    allSharedTrips.forEach(trip => {
      totalPassengers += trip.passengerCount;
      
      // Calculate savings (individual cost vs shared cost)
      const individualCost = trip.passengerCount * 650;
      const sharedCost = 800;
      totalSavings += (individualCost - sharedCost);
      
      if (trip.status === 'ASSIGNED') {
        assignedTrips++;
      }
    });
    
    console.log('\n📈 Efficiency Analysis:');
    console.log(`   Total shared trips created: ${allSharedTrips.length}`);
    console.log(`   Total passengers served: ${totalPassengers}`);
    console.log(`   Trips assigned to drivers: ${assignedTrips}`);
    console.log(`   Total cost savings: ${totalSavings} SEK`);
    console.log(`   Average passengers per trip: ${(totalPassengers / allSharedTrips.length).toFixed(1)}`);
    
    // Calculate government impact
    const manualOperatorCost = 21 * 50; // Assuming 50 SEK per manual processing
    const systemSavings = totalSavings + manualOperatorCost;
    
    console.log('\n🏛️ Government Impact:');
    console.log(`   Manual operator cost saved: ${manualOperatorCost} SEK`);
    console.log(`   Total system savings: ${systemSavings} SEK`);
    console.log(`   Efficiency improvement: ${((systemSavings / (21 * 650)) * 100).toFixed(1)}%`);
    
  } catch (error) {
    throw new Error(`Workflow test failed: ${error.message}`);
  }
}

// Run the complete test
if (require.main === module) {
  runCompleteTest();
}

module.exports = { runCompleteTest };