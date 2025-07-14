const axios = require('axios');

const API_URL = 'http://localhost:8081';

// Mock orders for testing - designed to be compatible for matching
const mockOrders = [
    {
        userId: 1,
        pickupAddress: "Mölndal Centrum, Göteborg",
        destinationAddress: "Sahlgrenska Universitetssjukhuset, Göteborg",
        pickupLatitude: 57.6554,
        pickupLongitude: 12.0138,
        destinationLatitude: 57.6868,
        destinationLongitude: 11.9742,
        requestedPickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        passengerCount: 1,
        needsWheelchairAccess: false,
        needsAssistance: true,
        specialRequirements: "Behöver hjälp med rullator",
        priority: "NORMAL"
    },
    {
        userId: 2,
        pickupAddress: "Partille Centrum, Göteborg", // Close to first pickup
        destinationAddress: "Sahlgrenska Universitetssjukhuset, Göteborg", // Same destination
        pickupLatitude: 57.6600, // Very close to first order
        pickupLongitude: 12.0150, // Very close to first order
        destinationLatitude: 57.6868,
        destinationLongitude: 11.9742,
        requestedPickupTime: new Date(Date.now() + 2.2 * 60 * 60 * 1000).toISOString(), // 2.2 hours from now (close time)
        passengerCount: 1,
        needsWheelchairAccess: false,
        needsAssistance: false,
        specialRequirements: "",
        priority: "NORMAL"
    },
    {
        userId: 3,
        pickupAddress: "Götaplatsen, Göteborg",
        destinationAddress: "Vårdcentral Västra Frölunda, Göteborg",
        pickupLatitude: 57.6969,
        pickupLongitude: 11.9885,
        destinationLatitude: 57.6479,
        destinationLongitude: 11.9196,
        requestedPickupTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
        passengerCount: 1,
        needsWheelchairAccess: false,
        needsAssistance: false,
        specialRequirements: "",
        priority: "NORMAL"
    },
    {
        userId: 1,
        pickupAddress: "Avenyn 15, Göteborg", // Close to third pickup
        destinationAddress: "Vårdcentral Västra Frölunda, Göteborg", // Same destination
        pickupLatitude: 57.7021, // Close to third order
        pickupLongitude: 11.9675, // Close to third order
        destinationLatitude: 57.6479,
        destinationLongitude: 11.9196,
        requestedPickupTime: new Date(Date.now() + 3.3 * 60 * 60 * 1000).toISOString(), // 3.3 hours from now (close time)
        passengerCount: 1,
        needsWheelchairAccess: false,
        needsAssistance: false,
        specialRequirements: "",
        priority: "NORMAL"
    },
    {
        userId: 2,
        pickupAddress: "Centralstation, Göteborg",
        destinationAddress: "Landvetter Flygplats, Göteborg",
        pickupLatitude: 57.7089,
        pickupLongitude: 11.9746,
        destinationLatitude: 57.6628,
        destinationLongitude: 12.2944,
        requestedPickupTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        passengerCount: 1,
        needsWheelchairAccess: false,
        needsAssistance: false,
        specialRequirements: "",
        priority: "NORMAL"
    }
];

async function createMockOrder(order, index) {
    try {
        console.log(`\n🚖 Creating order ${index + 1}:`);
        console.log(`   From: ${order.pickupAddress}`);
        console.log(`   To: ${order.destinationAddress}`);
        console.log(`   Time: ${new Date(order.requestedPickupTime).toLocaleString('sv-SE')}`);
        console.log(`   Needs: ${order.needsWheelchairAccess ? 'Wheelchair' : ''}${order.needsAssistance ? ' Assistance' : ''}`);
        
        const response = await axios.post(`${API_URL}/api/trips/book`, order);
        
        if (response.status === 200) {
            console.log(`   ✅ Order created successfully! Trip ID: ${response.data.id}`);
            console.log(`   💰 Estimated cost: ${response.data.estimatedCost} SEK`);
            console.log(`   📋 Status: ${response.data.status}`);
            
            // Check if it was matched
            if (response.data.status === 'MATCHED') {
                console.log(`   🎯 Automatically matched with shared trip!`);
            } else {
                console.log(`   ⏳ Status: ${response.data.status} - waiting for matching...`);
            }
        }
        
        return response.data;
    } catch (error) {
        console.error(`   ❌ Error creating order ${index + 1}:`, error.response?.data || error.message);
        return null;
    }
}

async function checkSystemStatus() {
    try {
        console.log('\n📊 Checking system status...');
        
        // Check backend
        const backendResponse = await axios.get(`${API_URL}/api/trips/pending`);
        console.log(`   🟢 Backend (8081): ${backendResponse.data.length} pending trips`);
        
        // Check real-time service
        const realtimeResponse = await axios.get('http://localhost:3001/status');
        console.log(`   🟢 Real-time service (3001): ${realtimeResponse.data.activeDrivers} active drivers, ${realtimeResponse.data.sharedTrips} shared trips`);
        
        // Check for shared trips
        const sharedTripsResponse = await axios.get('http://localhost:3001/api/shared-trips');
        console.log(`   🚖 Shared trips created: ${sharedTripsResponse.data.length}`);
        
        if (sharedTripsResponse.data.length > 0) {
            console.log('\n   📋 Shared trips details:');
            sharedTripsResponse.data.forEach((trip, index) => {
                console.log(`   ${index + 1}. Trip ${trip.id}: ${trip.passengerCount} passengers, Status: ${trip.status}`);
            });
        }
        
        return true;
    } catch (error) {
        console.error('   ❌ System check failed:', error.message);
        console.log('\n⚠️  Make sure both services are running:');
        console.log('   Terminal 1: cd backend && ./mvnw spring-boot:run');
        console.log('   Terminal 2: cd realtime-service && npm run dev');
        return false;
    }
}

async function runMatchmaking() {
    try {
        console.log('\n🎯 Running manual matchmaking...');
        const response = await axios.post(`${API_URL}/api/trips/matchmaking`);
        console.log(`   ✅ Matchmaking completed: ${response.data}`);
        return true;
    } catch (error) {
        console.error('   ❌ Matchmaking failed:', error.response?.data || error.message);
        return false;
    }
}

async function showTripsStatus() {
    try {
        console.log('\n📋 Current trips status:');
        const response = await axios.get(`${API_URL}/api/trips/pending`);
        
        if (response.data.length === 0) {
            console.log('   ✅ No pending trips - all have been processed!');
        } else {
            response.data.forEach((trip, index) => {
                console.log(`   ${index + 1}. Trip ID: ${trip.id} - Status: ${trip.status}`);
                console.log(`      From: ${trip.pickupAddress} → To: ${trip.destinationAddress}`);
                console.log(`      Cost: ${trip.estimatedCost} SEK, User: ${trip.user.firstName} ${trip.user.lastName}`);
                console.log(`      Pickup time: ${new Date(trip.requestedPickupTime).toLocaleString('sv-SE')}`);
                if (trip.sharedTrip) {
                    console.log(`      🎯 Part of shared trip: ${trip.sharedTrip.id}`);
                }
            });
        }
    } catch (error) {
        console.error('   ❌ Error fetching trips:', error.message);
    }
}

async function main() {
    console.log('🚀 Starting Göteborg Taxi System Test');
    console.log('=====================================');
    
    // Check if system is running
    const systemReady = await checkSystemStatus();
    if (!systemReady) {
        return;
    }
    
    console.log('\n⏳ Creating mock orders...');
    console.log('   Orders 1-2: Compatible (same destination, close pickup)');
    console.log('   Orders 3-4: Compatible (same destination, close pickup)');
    console.log('   Order 5: Individual trip');
    
    // Create orders one by one with delay
    const createdOrders = [];
    for (let i = 0; i < mockOrders.length; i++) {
        const order = await createMockOrder(mockOrders[i], i);
        if (order) {
            createdOrders.push(order);
        }
        
        // Wait 1 second between orders
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Wait for automatic matchmaking to complete
    console.log('\n⏳ Waiting for automatic matchmaking to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try manual matchmaking if automatic didn't work
    console.log('\n🔄 Trying manual matchmaking...');
    const matchingSuccess = await runMatchmaking();
    
    if (matchingSuccess) {
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Show final status
    await showTripsStatus();
    await checkSystemStatus();
    
    console.log('\n🎉 Test completed!');
    console.log('\n🔗 You can now check:');
    console.log('   📊 Management Dashboard: http://localhost:3001/dashboard.html');
    console.log('   📱 Real-time Status: http://localhost:3001/status');
    console.log('   🔧 Backend API: http://localhost:8081/api/trips/pending');
    console.log('   🚖 Shared Trips: http://localhost:3001/api/shared-trips');
    
    console.log('\n💡 Expected results:');
    console.log('   - Orders 1-2 should be merged into one shared trip');
    console.log('   - Orders 3-4 should be merged into another shared trip');
    console.log('   - Order 5 should remain individual');
    console.log('   - Dashboard should show 2 shared trips');
    console.log('   - Cost savings should be calculated');
}

// Run the test
main().catch(console.error);