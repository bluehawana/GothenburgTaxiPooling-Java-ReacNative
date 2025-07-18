// Mock Test Data Generator for Göteborg Taxi Carpooling System
// 20 realistic orders over 48 hours with flexible carpooling patterns

const mockAddresses = {
  // Common pickup locations in Göteborg
  pickup: [
    'Centralstation, Göteborg',
    'Landvetter Flygplats',
    'Sahlgrenska Universitetssjukhuset',
    'Göteborg City, Nordstan',
    'Liseberg, Göteborg',
    'Angered Centrum',
    'Frölunda Torg',
    'Backa Bil',
    'Kortedala Torg',
    'Bergsjöns Centrum',
    'Älvsjö vårdcentral',
    'Mölndals sjukhus',
    'Partille Centrum',
    'Lerum Vårdcentral',
    'Kungsbacka Centrum',
    'Kungälv Centrum',
    'Stenungsund Centrum',
    'Alingsås Centrum',
    'Borås Centrum',
    'Trollhättan Centrum'
  ],
  
  // Common destination locations
  destination: [
    'Sahlgrenska Universitetssjukhuset',
    'Östra sjukhuset',
    'Mölndals sjukhus',
    'Kungälv sjukhus',
    'Alingsås lasarett',
    'Borås lasarett',
    'Göteborg City, Nordstan',
    'Frölunda Torg',
    'Backa Bil',
    'Angered Centrum',
    'Partille Centrum',
    'Lerum Centrum',
    'Kungsbacka Centrum',
    'Landvetter Flygplats',
    'Centralstation, Göteborg',
    'Älvsjö vårdcentral',
    'Kortedala Torg',
    'Bergsjöns Centrum',
    'Stenungsund Centrum',
    'Trollhättan Centrum'
  ]
};

const mockCustomers = [
  { name: 'Anna Andersson', age: 73, needs: ['wheelchair'] },
  { name: 'Erik Eriksson', age: 68, needs: ['assistance'] },
  { name: 'Margareta Johansson', age: 81, needs: [] },
  { name: 'Gunnar Svensson', age: 76, needs: ['wheelchair'] },
  { name: 'Astrid Lindgren', age: 79, needs: ['assistance'] },
  { name: 'Olof Palme', age: 71, needs: [] },
  { name: 'Ingrid Bergman', age: 83, needs: ['assistance'] },
  { name: 'Carl Larsson', age: 67, needs: [] },
  { name: 'Selma Lagerlöf', age: 85, needs: ['wheelchair'] },
  { name: 'August Strindberg', age: 72, needs: [] },
  { name: 'Birgit Nilsson', age: 78, needs: ['assistance'] },
  { name: 'Göran Persson', age: 70, needs: [] },
  { name: 'Lena Olin', age: 74, needs: [] },
  { name: 'Stellan Skarsgård', age: 69, needs: [] },
  { name: 'Maja Svensson', age: 82, needs: ['wheelchair'] },
  { name: 'Lars Larsson', age: 75, needs: [] },
  { name: 'Karin Karlsson', age: 77, needs: ['assistance'] },
  { name: 'Nils Nilsson', age: 73, needs: [] },
  { name: 'Birgitta Bengtsson', age: 80, needs: [] },
  { name: 'Sven Svensson', age: 76, needs: ['wheelchair'] }
];

function generateMockOrders() {
  const orders = [];
  const startTime = new Date();
  
  // Generate 20 orders spread over 48 hours
  for (let i = 1; i <= 20; i++) {
    const customer = mockCustomers[i - 1];
    const hoursOffset = Math.floor(Math.random() * 48); // 0-48 hours from now
    const minutesOffset = Math.floor(Math.random() * 60); // 0-59 minutes
    
    const requestedTime = new Date(startTime);
    requestedTime.setHours(requestedTime.getHours() + hoursOffset);
    requestedTime.setMinutes(requestedTime.getMinutes() + minutesOffset);
    
    const pickupAddr = mockAddresses.pickup[Math.floor(Math.random() * mockAddresses.pickup.length)];
    const destAddr = mockAddresses.destination[Math.floor(Math.random() * mockAddresses.destination.length)];
    
    // Ensure pickup and destination are different
    let finalDestAddr = destAddr;
    if (pickupAddr === destAddr) {
      finalDestAddr = mockAddresses.destination[(mockAddresses.destination.indexOf(destAddr) + 1) % mockAddresses.destination.length];
    }
    
    const order = {
      id: i,
      userId: i,
      userName: customer.name,
      userAge: customer.age,
      pickupAddress: pickupAddr,
      destinationAddress: finalDestAddr,
      requestedPickupTime: requestedTime.toISOString(),
      passengerCount: Math.random() < 0.7 ? 1 : 2, // 70% single passenger, 30% two passengers
      needsWheelchairAccess: customer.needs.includes('wheelchair'),
      needsAssistance: customer.needs.includes('assistance'),
      specialRequirements: customer.needs.length > 0 ? customer.needs.join(', ') : '',
      priority: Math.random() < 0.1 ? 'HIGH' : (Math.random() < 0.2 ? 'LOW' : 'NORMAL'),
      estimatedCost: Math.random() < 0.5 ? 650 : 800, // Individual vs shared price
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      
      // Geographic coordinates (approximate for Göteborg area)
      pickupLatitude: 57.7089 + (Math.random() - 0.5) * 0.2,
      pickupLongitude: 11.9746 + (Math.random() - 0.5) * 0.2,
      destinationLatitude: 57.7089 + (Math.random() - 0.5) * 0.2,
      destinationLongitude: 11.9746 + (Math.random() - 0.5) * 0.2
    };
    
    orders.push(order);
  }
  
  // Sort by requested pickup time
  orders.sort((a, b) => new Date(a.requestedPickupTime) - new Date(b.requestedPickupTime));
  
  return orders;
}

// Generate carpooling patterns
function generateCarpoolingPatterns(orders) {
  const patterns = [];
  
  // Pattern 1: Pick up A, deliver A, then pick up B, deliver B
  patterns.push({
    type: 'sequential',
    description: 'Hämta A → Lämna A → Hämta B → Lämna B',
    example: 'Patient till sjukhus, sedan annan patient hem från sjukhus',
    orders: orders.slice(0, 2),
    sequence: [
      { action: 'pickup', orderId: orders[0]?.id, location: orders[0]?.pickupAddress },
      { action: 'dropoff', orderId: orders[0]?.id, location: orders[0]?.destinationAddress },
      { action: 'pickup', orderId: orders[1]?.id, location: orders[1]?.pickupAddress },
      { action: 'dropoff', orderId: orders[1]?.id, location: orders[1]?.destinationAddress }
    ],
    estimatedTime: 90, // minutes
    estimatedEarning: 1300
  });
  
  // Pattern 2: Pick up A and B, then deliver both
  patterns.push({
    type: 'batch_pickup',
    description: 'Hämta A → Hämta B → Lämna A → Lämna B',
    example: 'Samla flera patienter, sedan lämna alla på sjukhuset',
    orders: orders.slice(2, 4),
    sequence: [
      { action: 'pickup', orderId: orders[2]?.id, location: orders[2]?.pickupAddress },
      { action: 'pickup', orderId: orders[3]?.id, location: orders[3]?.pickupAddress },
      { action: 'dropoff', orderId: orders[2]?.id, location: orders[2]?.destinationAddress },
      { action: 'dropoff', orderId: orders[3]?.id, location: orders[3]?.destinationAddress }
    ],
    estimatedTime: 75,
    estimatedEarning: 800
  });
  
  // Pattern 3: Complex mixed pattern
  patterns.push({
    type: 'mixed',
    description: 'Hämta A → Lämna A → Hämta B → Hämta C → Lämna B → Lämna C',
    example: 'Leverera en, sedan hämta två och leverera båda',
    orders: orders.slice(4, 7),
    sequence: [
      { action: 'pickup', orderId: orders[4]?.id, location: orders[4]?.pickupAddress },
      { action: 'dropoff', orderId: orders[4]?.id, location: orders[4]?.destinationAddress },
      { action: 'pickup', orderId: orders[5]?.id, location: orders[5]?.pickupAddress },
      { action: 'pickup', orderId: orders[6]?.id, location: orders[6]?.pickupAddress },
      { action: 'dropoff', orderId: orders[5]?.id, location: orders[5]?.destinationAddress },
      { action: 'dropoff', orderId: orders[6]?.id, location: orders[6]?.destinationAddress }
    ],
    estimatedTime: 105,
    estimatedEarning: 1200
  });
  
  return patterns;
}

// Generate QR code content for easy mobile testing
function generateQRCodeContent() {
  const baseUrl = 'http://192.168.1.125'; // Change to your IP
  
  return {
    userApp: {
      android: `${baseUrl}:8081/user-app-android`,
      ios: `${baseUrl}:8081/user-app-ios`,
      content: `🚖 Göteborg Taxi User App\n\nAndroid: ${baseUrl}:8081/user-app-android\niOS: ${baseUrl}:8081/user-app-ios\n\nTest users:\n- Anna Andersson (ID: 1)\n- Erik Eriksson (ID: 2)\n- Margareta Johansson (ID: 3)`,
      qrData: `${baseUrl}:8081/user-app`
    },
    
    driverApp: {
      android: `${baseUrl}:8081/driver-app-android`,
      ios: `${baseUrl}:8081/driver-app-ios`,
      content: `🚖 Göteborg Taxi Driver App\n\nAndroid: ${baseUrl}:8081/driver-app-android\niOS: ${baseUrl}:8081/driver-app-ios\n\nTest drivers:\n- Driver 1 (GTB123)\n- Driver 2 (GTB456)\n- Driver 3 (GTB789)`,
      qrData: `${baseUrl}:8081/driver-app`
    },
    
    dashboard: {
      url: `${baseUrl}:3001/dashboard.html`,
      content: `📊 Management Dashboard\n\nURL: ${baseUrl}:3001/dashboard.html\n\nFeatures:\n- Live map tracking\n- Automatic/Manual mode\n- Order management\n- Real-time updates`,
      qrData: `${baseUrl}:3001/dashboard.html`
    }
  };
}

// Test scenarios for the 48-hour period
function generateTestScenarios() {
  return [
    {
      time: '08:00',
      scenario: 'Morning Rush - Hospital Appointments',
      orders: 3,
      description: 'Multiple elderly patients going to Sahlgrenska for morning appointments'
    },
    {
      time: '12:00',
      scenario: 'Lunch Time - Mixed Destinations',
      orders: 2,
      description: 'One patient returning from hospital, one going to shopping center'
    },
    {
      time: '15:30',
      scenario: 'Afternoon - Therapy Sessions',
      orders: 4,
      description: 'Several patients going to different therapy centers'
    },
    {
      time: '18:00',
      scenario: 'Evening - Return Home',
      orders: 2,
      description: 'Patients returning home from day care centers'
    },
    {
      time: '10:00+1',
      scenario: 'Next Day - Morning Routine',
      orders: 3,
      description: 'Regular morning appointments and check-ups'
    },
    {
      time: '14:00+1',
      scenario: 'Next Day - Afternoon Rush',
      orders: 4,
      description: 'Multiple destinations, complex routing needed'
    },
    {
      time: '20:00+1',
      scenario: 'Evening - Emergency and Regular',
      orders: 2,
      description: 'One high-priority order, one regular transport'
    }
  ];
}

// Driver constraint: One driver can only handle one merged order at a time
function enforceDriverConstraints() {
  return {
    maxConcurrentOrders: 1,
    maxPassengersPerTrip: 4,
    maxTripDuration: 120, // minutes
    requiredBreakBetweenTrips: 15, // minutes
    
    rules: [
      'En förare kan bara hantera en sammanslagen order i taget',
      'Maximalt 4 passagerare per resa',
      'Maximal resetid: 2 timmar',
      'Minst 15 minuters paus mellan resor',
      'Automatisk matching prioriterar närhet och tid',
      'Manuell hantering krävs för komplexa fall'
    ]
  };
}

module.exports = {
  generateMockOrders,
  generateCarpoolingPatterns,
  generateQRCodeContent,
  generateTestScenarios,
  enforceDriverConstraints,
  mockAddresses,
  mockCustomers
};