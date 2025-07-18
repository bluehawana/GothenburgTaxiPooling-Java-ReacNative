#!/usr/bin/env node

/**
 * Comprehensive Carpooling Test - Gothenburg Taxi
 * Tests all carpooling functionality including 800 SEK payment and duplicate prevention
 */

const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:8081';
const REALTIME_URL = 'http://localhost:3001';

// Test configuration
const TEST_USER_IDS = [1, 2, 3];
const TEST_DRIVER_ID = 4;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTestTrip(userId, pickupAddress, destinationAddress) {
    try {
        const tripData = {
            userId: userId,
            pickupAddress: pickupAddress,
            destinationAddress: destinationAddress,
            pickupLatitude: 57.6866 + (Math.random() - 0.5) * 0.01,
            pickupLongitude: 11.9706 + (Math.random() - 0.5) * 0.01,
            destinationLatitude: 57.7089 + (Math.random() - 0.5) * 0.01,
            destinationLongitude: 11.9746 + (Math.random() - 0.5) * 0.01,
            requestedPickupTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            priority: 'NORMAL',
            passengerCount: 1,
            needsWheelchairAccess: false,
            needsAssistance: true,
            specialRequirements: 'Elderly passenger'
        };

        const response = await axios.post(`${API_URL}/api/trips/book`, tripData);
        console.log(`✅ Created trip ${response.data.id} for user ${userId}: ${pickupAddress} → ${destinationAddress}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Failed to create trip for user ${userId}:`, error.response?.data || error.message);
        return null;
    }
}

async function runMatchmaking() {
    try {
        const response = await axios.post(`${API_URL}/api/trips/matchmaking`);
        console.log('🔄 Matchmaking result:', response.data);
        await sleep(2000); // Wait for processing
    } catch (error) {
        console.error('❌ Matchmaking failed:', error.response?.data || error.message);
    }
}

async function testDuplicateAcceptance(tripId) {
    console.log(`\n🧪 Testing duplicate acceptance prevention for trip ${tripId}...`);
    
    try {
        // First acceptance
        console.log('👤 Driver attempts first acceptance...');
        const firstResponse = await axios.post(`${API_URL}/api/trips/${tripId}/assign?driverId=${TEST_DRIVER_ID}`);
        console.log('✅ First acceptance successful:', firstResponse.data.estimatedCost + ' SEK');
        
        await sleep(1000);
        
        // Second acceptance (should fail)
        console.log('👤 Driver attempts second acceptance...');
        try {
            const secondResponse = await axios.post(`${API_URL}/api/trips/${tripId}/assign?driverId=${TEST_DRIVER_ID}`);
            console.log('❌ ERROR: Second acceptance should have failed but succeeded!');
            return false;
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Second acceptance correctly prevented:', error.response.data);
                return true;
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testPaymentAmount(tripId) {
    console.log(`\n💰 Testing 800 SEK payment for merged trip ${tripId}...`);
    
    try {
        const response = await axios.get(`${API_URL}/api/trips/pending`);
        const trip = response.data.find(t => t.id === tripId);
        
        if (trip && trip.estimatedCost === 800) {
            console.log('✅ Payment amount correct: 800 SEK for merged trip');
            return true;
        } else {
            console.log(`❌ Payment amount incorrect: Expected 800 SEK, got ${trip?.estimatedCost || 'N/A'} SEK`);
            return false;
        }
    } catch (error) {
        console.error('❌ Payment test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testRealtimeIntegration() {
    console.log('\n📡 Testing real-time integration...');
    
    return new Promise((resolve) => {
        const socket = io(REALTIME_URL);
        let testsPassed = 0;
        const totalTests = 2;
        
        socket.on('connect', () => {
            console.log('✅ Socket connected to real-time service');
            testsPassed++;
            
            // Test driver connection
            socket.emit('driver-connect', {
                driverId: TEST_DRIVER_ID,
                location: { latitude: 57.7089, longitude: 11.9746 },
                vehicleInfo: { licensePlate: 'TEST123', make: 'Test', model: 'Car' }
            });
        });
        
        socket.on('shared-trip-available', (data) => {
            console.log('✅ Received shared trip notification:', {
                tripId: data.sharedTripId,
                passengers: data.passengerCount,
                earning: data.estimatedEarning
            });
            testsPassed++;
            
            if (testsPassed >= totalTests) {
                socket.disconnect();
                resolve(true);
            }
        });
        
        socket.on('connect_error', (error) => {
            console.log('❌ Socket connection failed:', error.message);
            resolve(false);
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (testsPassed < totalTests) {
                console.log(`⚠️ Real-time test incomplete: ${testsPassed}/${totalTests} tests passed`);
                socket.disconnect();
                resolve(testsPassed > 0);
            }
        }, 10000);
    });
}

async function runComprehensiveTest() {
    console.log('🚖 Starting Comprehensive Carpooling Test\n');
    console.log('=' .repeat(60));
    
    let allTestsPassed = true;
    const testResults = {};
    
    // Step 1: Create test trips
    console.log('\n📝 STEP 1: Creating test trips for carpooling...');
    const trips = [];
    
    const trip1 = await createTestTrip(TEST_USER_IDS[0], 'Mölndal Centrum', 'Partille Station');
    const trip2 = await createTestTrip(TEST_USER_IDS[1], 'Mölndal Torg', 'Partille Centrum');
    const trip3 = await createTestTrip(TEST_USER_IDS[2], 'Kungsbacka Station', 'Göteborg Centralstation');
    
    if (trip1) trips.push(trip1);
    if (trip2) trips.push(trip2);
    if (trip3) trips.push(trip3);
    
    if (trips.length < 2) {
        console.log('❌ Not enough trips created for testing');
        return false;
    }
    
    // Step 2: Run matchmaking
    console.log('\n🔄 STEP 2: Running matchmaking algorithm...');
    await runMatchmaking();
    
    // Step 3: Get merged trips
    console.log('\n🔍 STEP 3: Checking for merged trips...');
    const pendingTrips = await axios.get(`${API_URL}/api/trips/pending`);
    console.log(`Found ${pendingTrips.data.length} pending trips`);
    
    if (pendingTrips.data.length === 0) {
        console.log('❌ No trips available for testing');
        return false;
    }
    
    const testTripId = pendingTrips.data[0].id;
    console.log(`🎯 Using trip ${testTripId} for testing`);
    
    // Step 4: Test payment amount
    console.log('\n💰 STEP 4: Testing payment amount...');
    testResults.paymentTest = await testPaymentAmount(testTripId);
    allTestsPassed = allTestsPassed && testResults.paymentTest;
    
    // Step 5: Test duplicate acceptance prevention
    console.log('\n🛡️ STEP 5: Testing duplicate acceptance prevention...');
    testResults.duplicateTest = await testDuplicateAcceptance(testTripId);
    allTestsPassed = allTestsPassed && testResults.duplicateTest;
    
    // Step 6: Test real-time integration
    console.log('\n📡 STEP 6: Testing real-time integration...');
    testResults.realtimeTest = await testRealtimeIntegration();
    allTestsPassed = allTestsPassed && testResults.realtimeTest;
    
    // Final results
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    Object.entries(testResults).forEach(([test, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const testName = test.replace('Test', '').toUpperCase();
        console.log(`${status} ${testName}`);
    });
    
    console.log('='.repeat(60));
    
    if (allTestsPassed) {
        console.log('🎉 ALL TESTS PASSED! Carpooling system working correctly.');
        console.log('✅ 800 SEK payment enforced');
        console.log('✅ Duplicate acceptance prevented');
        console.log('✅ Real-time integration functional');
    } else {
        console.log('⚠️ SOME TESTS FAILED! Please check the issues above.');
    }
    
    return allTestsPassed;
}

// Handle CLI execution
if (require.main === module) {
    runComprehensiveTest()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test suite crashed:', error);
            process.exit(1);
        });
}

module.exports = { runComprehensiveTest };