// Simple test to verify accept flow
const axios = require('axios');

async function testAcceptFlow() {
  try {
    console.log('🧪 Testing accept flow...');
    
    // 1. Test backend assignment
    console.log('1. Testing backend assignment...');
    const assignResponse = await axios.post('http://localhost:8081/api/trips/1/assign?driverId=4');
    console.log('✅ Backend assignment successful:', assignResponse.data.status);
    
    // 2. Test realtime service
    console.log('2. Testing realtime service...');
    const realtimeResponse = await axios.post('http://localhost:3001/api/shared-trip-created', {
      sharedTripId: 'test-flow-123',
      trips: [{
        id: 1,
        userName: 'Test User',
        pickupAddress: 'Test Pickup',
        destinationAddress: 'Test Destination',
        passengerCount: 2
      }],
      passengerCount: 2
    });
    console.log('✅ Realtime service working:', realtimeResponse.data);
    
    console.log('🎯 Flow test completed - accept should work now!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAcceptFlow();