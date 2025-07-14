const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:8081';
const REALTIME_URL = 'http://localhost:3001';

// Mock orders designed for testing driver notifications
const mockOrders = [
    {
        userId: 1,
        pickupAddress: "Mölndal Centrum, Göteborg",
        destinationAddress: "Sahlgrenska Universitetssjukhuset, Göteborg",
        pickupLatitude: 57.6554,
        pickupLongitude: 12.0138,
        destinationLatitude: 57.6868,
        destinationLongitude: 11.9742,
        requestedPickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        passengerCount: 1,
        needsWheelchairAccess: false,
        needsAssistance: true,
        specialRequirements: "Behöver hjälp med rullator",
        priority: "NORMAL"
    },
    {
        userId: 2,
        pickupAddress: "Partille Centrum, Göteborg",
        destinationAddress: "Sahlgrenska Universitetssjukhuset, Göteborg",
        pickupLatitude: 57.6600,
        pickupLongitude: 12.0150,
        destinationLatitude: 57.6868,
        destinationLongitude: 11.9742,
        requestedPickupTime: new Date(Date.now() + 2.2 * 60 * 60 * 1000).toISOString(),
        passengerCount: 1,
        needsWheelchairAccess: false,
        needsAssistance: false,
        specialRequirements: "",
        priority: "NORMAL"
    }
];

// Mock driver simulation
async function simulateDriver() {
    console.log('\n🚗 Simulating Driver Connection...');
    
    const socket = io(REALTIME_URL);
    
    socket.on('connect', () => {
        console.log('   ✅ Driver connected to real-time service');
        
        // Connect as driver
        socket.emit('driver-connect', {
            driverId: 999, // Test driver ID
            location: {
                latitude: 57.6554,
                longitude: 12.0138
            },
            vehicleInfo: {
                licensePlate: 'TEST123',
                make: 'Volvo',
                model: 'V70',
                wheelchairAccessible: false
            }
        });
        
        console.log('   📡 Driver registered with ID: 999');
    });
    
    // Listen for shared trip notifications
    socket.on('shared-trip-available', (data) => {
        console.log('\n🔔 DRIVER NOTIFICATION RECEIVED!');
        console.log(`   🚖 Shared Trip ID: ${data.sharedTripId}`);
        console.log(`   👥 Passengers: ${data.passengerCount}`);
        console.log(`   💰 Earning: ${data.estimatedEarning} SEK`);
        console.log(`   📍 Pickups: ${data.pickupAddresses?.join(', ')}`);
        console.log(`   🏁 Destinations: ${data.destinationAddresses?.join(', ')}`);
        
        // Simulate driver accepting the trip after 3 seconds
        setTimeout(() => {
            console.log('\n✅ DRIVER ACCEPTING TRIP...');
            socket.emit('shared-trip-accept', {
                sharedTripId: data.sharedTripId,
                driverId: 999
            });
            console.log('   🎯 Trip acceptance sent to server');
        }, 3000);
    });
    
    // Listen for trip assignment confirmation
    socket.on('trip-assignment', (data) => {
        console.log('\n🎯 TRIP ASSIGNED TO DRIVER!');
        console.log(`   Trip ID: ${data.tripId}`);
        console.log('   📍 Starting location sharing...');
        
        // Start sending location updates every 5 seconds
        setInterval(() => {
            socket.emit('location-update', {
                driverId: 999,
                location: {
                    latitude: 57.6554 + Math.random() * 0.01,
                    longitude: 12.0138 + Math.random() * 0.01
                }
            });
        }, 5000);
    });
    
    return socket;
}

// Mock passenger simulation
async function simulatePassenger(userId) {
    console.log(`\n👤 Simulating Passenger ${userId} Connection...`);
    
    const socket = io(REALTIME_URL);
    
    socket.on('connect', () => {
        socket.emit('passenger-connect', {
            userId: userId
        });
        console.log(`   ✅ Passenger ${userId} connected`);
    });
    
    // Listen for driver assignment
    socket.on('driver-assigned', (data) => {
        console.log(`\n📱 PASSENGER ${userId} NOTIFICATION:`);
        console.log(`   🚗 Driver assigned: ${data.driverId}`);
        console.log(`   🚖 Vehicle: ${data.driverInfo?.make} ${data.driverInfo?.model}`);
        console.log(`   ⏰ ETA: ${data.estimatedArrival}`);
    });
    
    // Listen for driver location updates
    socket.on('driver-location-update', (data) => {
        console.log(`\n📍 Passenger ${userId}: Driver location update`);
        console.log(`   Driver ${data.driverId} at: ${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}`);
    });
    
    return socket;
}

async function createMockOrder(order, index) {
    try {
        console.log(`\n🚖 Creating order ${index + 1} for User ${order.userId}:`);
        console.log(`   From: ${order.pickupAddress}`);
        console.log(`   To: ${order.destinationAddress}`);
        
        const response = await axios.post(`${API_URL}/api/trips/book`, order);
        
        if (response.status === 200) {
            console.log(`   ✅ Order created! Trip ID: ${response.data.id}`);
            console.log(`   📋 Status: ${response.data.status}`);
            
            if (response.data.status === 'MATCHED') {
                console.log(`   🎯 Automatically matched!`);
            }
        }
        
        return response.data;
    } catch (error) {
        console.error(`   ❌ Error creating order:`, error.response?.data || error.message);
        return null;
    }
}

async function checkDashboardStats() {
    try {
        const response = await axios.get(`${REALTIME_URL}/status`);
        console.log('\n📊 DASHBOARD STATS:');
        console.log(`   🚗 Active Drivers: ${response.data.activeDrivers}`);
        console.log(`   🚖 Shared Trips: ${response.data.sharedTrips}`);
        console.log(`   👥 Connected Passengers: ${response.data.connectedPassengers}`);
    } catch (error) {
        console.error('   ❌ Error checking dashboard:', error.message);
    }
}

async function main() {
    console.log('🚀 COMPLETE TAXI SYSTEM TEST');
    console.log('============================');
    console.log('This will test the full flow:');
    console.log('1. 📱 Driver connects and waits for trips');
    console.log('2. 👤 Passengers connect');
    console.log('3. 🚖 Orders are created and matched');
    console.log('4. 🔔 Driver gets notification');
    console.log('5. ✅ Driver accepts trip');
    console.log('6. 📍 Passengers get updates');
    console.log('7. 📊 Dashboard shows everything');
    
    // Start mock driver
    const driverSocket = await simulateDriver();
    
    // Wait for driver to connect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start mock passengers
    const passenger1Socket = await simulatePassenger(1);
    const passenger2Socket = await simulatePassenger(2);
    
    // Wait for passengers to connect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check initial dashboard stats
    await checkDashboardStats();
    
    console.log('\n⏳ Creating orders that should be matched...');
    
    // Create compatible orders
    for (let i = 0; i < mockOrders.length; i++) {
        await createMockOrder(mockOrders[i], i);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Wait for matchmaking and notifications
    console.log('\n⏳ Waiting for matchmaking and driver notifications...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try manual matchmaking if needed
    try {
        console.log('\n🔄 Triggering manual matchmaking...');
        await axios.post(`${API_URL}/api/trips/matchmaking`);
        console.log('   ✅ Manual matchmaking triggered');
    } catch (error) {
        console.error('   ❌ Manual matchmaking failed:', error.message);
    }
    
    // Wait for driver acceptance and passenger notifications
    console.log('\n⏳ Waiting for driver to accept and passengers to get updates...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Final dashboard check
    console.log('\n🎉 FINAL RESULTS:');
    await checkDashboardStats();
    
    // Check shared trips
    try {
        const sharedTrips = await axios.get(`${REALTIME_URL}/api/shared-trips`);
        console.log(`\n🚖 Shared Trips Created: ${sharedTrips.data.length}`);
        sharedTrips.data.forEach((trip, index) => {
            console.log(`   ${index + 1}. Trip ${trip.id}: ${trip.passengerCount} passengers, Status: ${trip.status}`);
        });
    } catch (error) {
        console.error('Error checking shared trips:', error.message);
    }
    
    console.log('\n🔗 Check the live dashboard at: http://localhost:3001/dashboard.html');
    console.log('💡 You should see:');
    console.log('   - Driver position updates');
    console.log('   - Shared trip creation');
    console.log('   - Real-time statistics');
    console.log('   - Driver and passenger activity');
    
    console.log('\n🎯 Test will continue running for 30 seconds to show real-time updates...');
    
    // Keep running for 30 seconds to show real-time updates
    setTimeout(() => {
        console.log('\n✅ Test completed! Check the dashboard for live updates.');
        process.exit(0);
    }, 30000);
}

// Run the complete test
main().catch(console.error);