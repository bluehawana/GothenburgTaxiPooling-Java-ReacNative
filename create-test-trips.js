const axios = require('axios');

async function createTestTrips() {
  console.log('🎯 Creating test trips...');
  
  const testTrips = [
    {
      userId: 1,
      pickupAddress: "Mölndal Centrum",
      destinationAddress: "Partille Station",
      requestedPickupTime: "2025-07-18T11:00:00",
      pickupLatitude: 57.6586,
      pickupLongitude: 11.9736,
      destinationLatitude: 57.7089,
      destinationLongitude: 11.9746,
      priority: "NORMAL",
      passengerCount: 1,
      needsWheelchairAccess: false,
      needsAssistance: false
    },
    {
      userId: 2,
      pickupAddress: "Lindholmen",
      destinationAddress: "Nordstan",
      requestedPickupTime: "2025-07-18T11:15:00",
      pickupLatitude: 57.7075,
      pickupLongitude: 11.9400,
      destinationLatitude: 57.7089,
      destinationLongitude: 11.9746,
      priority: "NORMAL",
      passengerCount: 1,
      needsWheelchairAccess: false,
      needsAssistance: false
    }
  ];
  
  const createdTrips = [];
  
  for (const trip of testTrips) {
    try {
      const response = await axios.post('http://localhost:8081/api/trips/book', trip);
      console.log('✅ Created trip:', response.data.id, '-', response.data.pickupAddress);
      createdTrips.push(response.data);
    } catch (error) {
      console.error('❌ Failed to create trip:', error.message);
    }
  }
  
  console.log(`🎯 Created ${createdTrips.length} test trips`);
  return createdTrips;
}

// Run test
createTestTrips().then(trips => {
  console.log('\n📋 Available trips for testing:');
  trips.forEach(trip => {
    console.log(`- Trip ${trip.id}: ${trip.pickupAddress} → ${trip.destinationAddress} (800 SEK)`);
  });
});