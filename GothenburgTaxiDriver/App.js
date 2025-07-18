import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  FlatList
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import io from 'socket.io-client';

// Use localhost for testing
const API_URL = 'http://localhost:8081';
const REALTIME_URL = 'http://localhost:3001';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function DriverApp() {
  const [location, setLocation] = useState(null);
  const [driverId] = useState(4); // Sample driver ID
  const [isOnline, setIsOnline] = useState(false);
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [socket, setSocket] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, trips: 0, currentOrderId: null });
  const [acceptingTrips, setAcceptingTrips] = useState(new Set()); // Track accepting trips
  const [currentTripStatus, setCurrentTripStatus] = useState(null);
  const [activeSharedTrip, setActiveSharedTrip] = useState(null);
  
  // Driver vehicle information
  const [vehicleInfo] = useState({
    licensePlate: 'GTB789',
    make: 'Volvo',
    model: 'V70',
    color: 'Vit',
    phoneNumber: '031-789-1234',
    driverName: `Förare ${4}`,
    wheelchairAccessible: false
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();

    // Initialize socket connection
    const newSocket = io(REALTIME_URL);
    setSocket(newSocket);

    newSocket.on('trip-assignment', (tripData) => {
      Alert.alert('Ny resa tilldelad!', `Du har fått en ny delad resa med ${tripData.passengers.length} passagerare.`);
      setAssignedTrips(prev => [...prev, tripData]);
    });

    newSocket.on('shared-trip-available', (sharedTripData) => {
      Alert.alert(
        'Ny delad resa tillgänglig!', 
        `${sharedTripData.passengerCount} passagerare, ${sharedTripData.estimatedEarning} SEK`,
        [
          { text: 'Avvisa', style: 'cancel' },
          { 
            text: 'Acceptera', 
            onPress: () => acceptSharedTrip(sharedTripData.sharedTripId)
          }
        ]
      );
      
      // Add to available trips list
      setAssignedTrips(prev => [...prev, {
        tripId: sharedTripData.sharedTripId,
        isSharedTrip: true,
        passengers: sharedTripData.trips || [],
        estimatedEarning: sharedTripData.estimatedEarning,
        pickupAddresses: sharedTripData.pickupAddresses,
        destinationAddresses: sharedTripData.destinationAddresses
      }]);
    });

    newSocket.on('shared-trip-taken', (data) => {
      // Remove the trip from available trips as another driver took it
      setAssignedTrips(prev => prev.filter(trip => trip.tripId !== data.sharedTripId));
    });

    newSocket.on('assignment-rejected', (data) => {
      Alert.alert(
        'Uppdrag avvisat',
        data.reason,
        [{ text: 'OK', style: 'default' }]
      );
      
      // Remove the trip from available trips
      if (data.sharedTripId) {
        setAssignedTrips(prev => prev.filter(trip => trip.tripId !== data.sharedTripId));
      }
    });

    return () => newSocket.close();
  }, []);

  const toggleOnlineStatus = () => {
    if (!location) {
      Alert.alert('Error', 'Väntar på GPS-position...');
      return;
    }

    const newStatus = !isOnline;
    setIsOnline(newStatus);

    if (newStatus && socket) {
      // Connect as driver
      socket.emit('driver-connect', {
        driverId: driverId,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        vehicleInfo: vehicleInfo
      });

      // Start sending location updates every 10 seconds
      const locationInterval = setInterval(() => {
        if (socket && location) {
          socket.emit('location-update', {
            driverId: driverId,
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }
          });
        }
      }, 10000);

      Alert.alert('Status', 'Du är nu online och tillgänglig för resor!');
    } else {
      Alert.alert('Status', 'Du är nu offline.');
    }
  };

  const acceptSharedTrip = (sharedTripId) => {
    console.log('acceptSharedTrip called for trip:', sharedTripId);
    
    // STRONG CHECK: If trip is already being processed
    if (acceptingTrips.has(sharedTripId)) {
      Alert.alert('Varning', 'Du har accepterat denna order, behöver inte att göra det igen!');
      return;
    }
    
    // STRONG CHECK: If trip is already accepted
    const trip = assignedTrips.find(t => t.tripId === sharedTripId);
    if (trip && trip.accepted) {
      Alert.alert('Varning', 'Du har accepterat denna order, behöver inte att göra det igen!');
      return;
    }
    
    // STRONG CHECK: Prevent multiple simultaneous calls
    if (trip && trip.status === 'ASSIGNED') {
      Alert.alert('Varning', 'Du har accepterat denna order, behöver inte att göra det igen!');
      return;
    }
    
    console.log('Adding trip to accepting set:', sharedTripId);
    
    // Add to accepting set IMMEDIATELY to prevent double acceptance
    setAcceptingTrips(prev => {
      const newSet = new Set([...prev, sharedTripId]);
      console.log('acceptingTrips now contains:', Array.from(newSet));
      return newSet;
    });
    
    // Immediately disable button for this specific trip
    setAssignedTrips(prev => prev.map(tripItem => 
      tripItem.tripId === sharedTripId 
        ? { ...tripItem, accepted: true, status: 'ASSIGNED' }
        : tripItem
    ));
    
    // Mark trip as accepted IMMEDIATELY in state
    setAssignedTrips(prev => prev.map(tripItem => 
      tripItem.tripId === sharedTripId 
        ? { ...tripItem, status: 'ASSIGNED', accepted: true, accepting: true }
        : tripItem
    ));
    
    // Send to server
    if (socket) {
      socket.emit('shared-trip-accept', {
        sharedTripId: sharedTripId,
        driverId: driverId
      });
    }
    
    // Display fixed 800 SEK for merged orders - exactly Gothenburg Kommun requirement
    if (earnings.currentOrderId === sharedTripId) {
      Alert.alert('Varning', 'Du har redan accepterat denna order (800 SEK)');
      return; // Skip duplicate
    }
    
    setEarnings({
      today: 800, // Fixed 800 SEK for merged orders
      trips: 1,
      currentOrderId: sharedTripId
    });
    
    Alert.alert('Framgång', 'Delad resa accepterad! Navigera till första upphämtningsplatsen.');
    
    // Set this as the active trip
    setActiveSharedTrip(sharedTripId);
    setCurrentTripStatus('assigned');
    
    // Clean up accepting state after 2 seconds
    setTimeout(() => {
      setAcceptingTrips(prev => {
        const newSet = new Set(prev);
        newSet.delete(sharedTripId);
        console.log('Removed from accepting set:', sharedTripId);
        return newSet;
      });
      
      setAssignedTrips(prev => prev.map(tripItem => 
        tripItem.tripId === sharedTripId 
          ? { ...tripItem, accepting: false }
          : tripItem
      ));
    }, 2000);
  };

  const acceptTrip = (tripId) => {
    Alert.alert(
      'Acceptera resa',
      'Vill du acceptera denna delade resa?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Acceptera', 
          onPress: () => {
            if (socket) {
              socket.emit('trip-status-update', {
                tripId: tripId,
                status: 'ASSIGNED',
                driverId: driverId
              });
            }
            Alert.alert('Framgång', 'Resa accepterad! Navigera till första upphämtningsplatsen.');
          }
        }
      ]
    );
  };

  const completePickup = (tripId, passengerId) => {
    Alert.alert(
      'Bekräfta upphämtning',
      'Har du hämtat upp passageraren?',
      [
        { text: 'Nej', style: 'cancel' },
        { 
          text: 'Ja', 
          onPress: () => {
            if (socket) {
              socket.emit('passenger-pickup-confirmed', {
                tripId: tripId,
                passengerId: passengerId,
                estimatedArrival: '15 min',
                driverLocation: location
              });
            }
            Alert.alert('Bekräftat', 'Upphämtning registrerad!');
          }
        }
      ]
    );
  };

  // New comprehensive status update functions
  const confirmPickup = () => {
    if (!activeSharedTrip || !socket) return;
    
    Alert.alert(
      'Bekräfta upphämtning',
      'Bekräfta att du är på väg för att hämta passagerarna.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Bekräfta', 
          onPress: () => {
            socket.emit('driver-pickup-confirmed', {
              sharedTripId: activeSharedTrip,
              driverId: driverId,
              estimatedArrival: '12:45',
              driverInfo: vehicleInfo
            });
            
            setCurrentTripStatus('pickup_confirmed');
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: '📍 Upphämtning bekräftad',
                body: 'Passagerarna har informerats om att du är på väg.',
              },
              trigger: null,
            });
            
            Alert.alert('Bekräftat', 'Passagerarna har fått besked att du är på väg!');
          }
        }
      ]
    );
  };

  const markArrived = () => {
    if (!activeSharedTrip || !socket) return;
    
    Alert.alert(
      'Ankomst',
      'Har du anlänt vid upphämtningsplatsen?',
      [
        { text: 'Nej', style: 'cancel' },
        { 
          text: 'Ja, jag är här', 
          onPress: () => {
            socket.emit('driver-arrived', {
              sharedTripId: activeSharedTrip,
              driverId: driverId,
              driverInfo: vehicleInfo
            });
            
            setCurrentTripStatus('arrived');
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: '🚖 Ankomst registrerad',
                body: 'Passagerarna har informerats om att du har anlänt.',
              },
              trigger: null,
            });
            
            Alert.alert('Ankomst registrerad', 'Passagerarna vet att du är här!');
          }
        }
      ]
    );
  };

  const startTrip = () => {
    if (!activeSharedTrip || !socket) return;
    
    Alert.alert(
      'Starta resa',
      'Har alla passagerare stigit på? Klar att starta resan?',
      [
        { text: 'Vänta', style: 'cancel' },
        { 
          text: 'Starta resa', 
          onPress: () => {
            socket.emit('trip-started', {
              sharedTripId: activeSharedTrip,
              driverId: driverId
            });
            
            setCurrentTripStatus('in_progress');
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: '🛣️ Resa påbörjad',
                body: 'Ha en säker resa till destinationen.',
              },
              trigger: null,
            });
            
            Alert.alert('Resa påbörjad', 'Kör säkert till destinationen!');
          }
        }
      ]
    );
  };

  const completeTrip = () => {
    if (!activeSharedTrip || !socket) return;
    
    Alert.alert(
      'Avsluta resa',
      'Har alla passagerare kommit fram till sina destinationer?',
      [
        { text: 'Inte än', style: 'cancel' },
        { 
          text: 'Resa avslutad', 
          onPress: () => {
            socket.emit('trip-completed', {
              sharedTripId: activeSharedTrip,
              driverId: driverId
            });
            
            setCurrentTripStatus('completed');
            setActiveSharedTrip(null);
            
            // Remove completed trip from list
            setAssignedTrips(prev => prev.filter(trip => trip.tripId !== activeSharedTrip));
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: '✅ Resa avslutad',
                body: 'Bra jobbat! Du är nu tillgänglig för nya resor.',
              },
              trigger: null,
            });
            
            Alert.alert('Resa avslutad', 'Tack för en säker resa! Du är nu tillgänglig för nya uppdrag.');
          }
        }
      ]
    );
  };

  const renderTripItem = ({ item }) => (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripTitle}>
          {item.isSharedTrip ? '🚖 Delad resa (Automatisk matchning)' : '🚖 Delad resa'}
        </Text>
        <Text style={styles.tripEarning}>+{item.estimatedEarning || 800} SEK</Text>
      </View>
      
      <Text style={styles.tripDetail}>
        👥 {item.passengers?.length || item.passengerCount || 2} passagerare
      </Text>
      
      {item.isSharedTrip && item.pickupAddresses ? (
        <View>
          <Text style={styles.tripDetail}>📍 Upphämtningar:</Text>
          {item.pickupAddresses.map((address, index) => (
            <Text key={index} style={styles.tripDetail}>  • {address}</Text>
          ))}
          <Text style={styles.tripDetail}>🏁 Destinationer:</Text>
          {item.destinationAddresses.map((address, index) => (
            <Text key={index} style={styles.tripDetail}>  • {address}</Text>
          ))}
        </View>
      ) : (
        <Text style={styles.tripDetail}>📍 Upphämtning: Mölndal → Partille</Text>
      )}
      
      <Text style={styles.tripDetail}>⏰ Tid: {new Date().toLocaleTimeString('sv-SE')}</Text>
      
      <View style={styles.passengersList}>
        <Text style={styles.passengersTitle}>Passagerare:</Text>
        {item.isSharedTrip && item.passengers?.length > 0 ? (
          item.passengers.map((passenger, index) => (
            <Text key={index} style={styles.passengerItem}>
              • Passagerare {index + 1} - {passenger.pickupAddress}
            </Text>
          ))
        ) : (
          <>
            <Text style={styles.passengerItem}>• Anna, 75 år - Mölndal Centrum</Text>
            <Text style={styles.passengerItem}>• Erik, 68 år - Partille Station</Text>
          </>
        )}
      </View>

      <View style={styles.tripActions}>
        {(!item.accepted && !acceptingTrips.has(item.tripId)) ? (
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => item.isSharedTrip ? acceptSharedTrip(item.tripId) : acceptTrip(item.tripId)}
          >
            <Text style={styles.acceptButtonText}>✅ Acceptera</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.acceptedButton}>
            <Text style={styles.acceptButtonText}>
              {acceptingTrips.has(item.tripId) ? '⏳ Accepterad' : '✅ Accepterad'}
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.pickupButton}
          onPress={() => completePickup(item.tripId, 1)}
        >
          <Text style={styles.pickupButtonText}>📍 Hämtad</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Sample data for demonstration
  const sampleTrips = [
    {
      tripId: 1,
      passengers: [
        { id: 1, name: 'Anna', age: 75, pickup: 'Mölndal Centrum' },
        { id: 2, name: 'Erik', age: 68, pickup: 'Partille Station' }
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚖 Göteborg Taxi Driver</Text>
        <Text style={styles.subtitle}>Förare: Lars Larsson (ABC123)</Text>
      </View>

      <View style={styles.statusSection}>
        <View style={styles.statusCard}>
          <TouchableOpacity 
            style={[styles.statusButton, isOnline ? styles.onlineButton : styles.offlineButton]}
            onPress={toggleOnlineStatus}
          >
            <Text style={styles.statusButtonText}>
              {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsTitle}>Dagens intäkter</Text>
            <Text style={styles.earningsAmount}>{earnings.today} SEK</Text>
            <Text style={styles.earningsTrips}>{earnings.trips} resor</Text>
          </View>
        </View>
      </View>

      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>📍 Min position</Text>
        <Text style={styles.locationText}>
          {location ? 
            `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : 
            'Hämtar GPS-position...'
          }
        </Text>
        <Text style={styles.locationDesc}>
          {isOnline ? '📡 Skickar position var 10:e sekund' : '📴 Position skickas ej'}
        </Text>
      </View>

      {/* Trip Status Control Section */}
      {activeSharedTrip && (
        <View style={styles.tripStatusSection}>
          <Text style={styles.sectionTitle}>🚖 Aktiv resa - Status kontroll</Text>
          <View style={styles.statusCard}>
            <Text style={styles.activeTrip}>Delad resa #{activeSharedTrip}</Text>
            <Text style={styles.tripStatus}>
              Status: {currentTripStatus === 'assigned' ? '✅ Tilldelad' :
                       currentTripStatus === 'pickup_confirmed' ? '📍 På väg' :
                       currentTripStatus === 'arrived' ? '🚖 Anlänt' :
                       currentTripStatus === 'in_progress' ? '🛣️ Pågår' : '⏳ Väntar...'}
            </Text>
            
            <View style={styles.statusButtonsContainer}>
              {currentTripStatus === 'assigned' && (
                <TouchableOpacity style={styles.statusActionButton} onPress={confirmPickup}>
                  <Text style={styles.statusActionText}>📍 Bekräfta upphämtning</Text>
                </TouchableOpacity>
              )}
              
              {currentTripStatus === 'pickup_confirmed' && (
                <TouchableOpacity style={styles.statusActionButton} onPress={markArrived}>
                  <Text style={styles.statusActionText}>🚖 Jag har anlänt</Text>
                </TouchableOpacity>
              )}
              
              {currentTripStatus === 'arrived' && (
                <TouchableOpacity style={styles.statusActionButton} onPress={startTrip}>
                  <Text style={styles.statusActionText}>🛣️ Starta resa</Text>
                </TouchableOpacity>
              )}
              
              {currentTripStatus === 'in_progress' && (
                <TouchableOpacity style={[styles.statusActionButton, styles.completeButton]} onPress={completeTrip}>
                  <Text style={styles.statusActionText}>✅ Avsluta resa</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.tripsSection}>
        <Text style={styles.sectionTitle}>🎯 Tilldelade resor</Text>
        {assignedTrips.length > 0 || sampleTrips.length > 0 ? (
          <FlatList
            data={assignedTrips.length > 0 ? assignedTrips : sampleTrips}
            renderItem={renderTripItem}
            keyExtractor={(item) => item.tripId.toString()}
            style={styles.tripsList}
          />
        ) : (
          <View style={styles.noTripsContainer}>
            <Text style={styles.noTripsText}>
              {isOnline ? '⏳ Väntar på resor...' : '📴 Gå online för att ta emot resor'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>💰 Fördelar med delad taxi</Text>
        <View style={styles.benefitsList}>
          <Text style={styles.benefitItem}>• 800 SEK för 2-3 passagerare vs 650 SEK × antal personer</Text>
          <Text style={styles.benefitItem}>• Högre intäkter per resa</Text>
          <Text style={styles.benefitItem}>• Hjälper miljön genom färre bilresor</Text>
          <Text style={styles.benefitItem}>• Automatisk matchning av passagerare</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  statusSection: {
    padding: 15,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
  },
  onlineButton: {
    backgroundColor: '#059669',
  },
  offlineButton: {
    backgroundColor: '#dc2626',
  },
  statusButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  earningsContainer: {
    alignItems: 'center',
  },
  earningsTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  earningsTrips: {
    fontSize: 12,
    color: '#6b7280',
  },
  locationSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'monospace',
  },
  locationDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  tripsSection: {
    flex: 1,
    margin: 15,
  },
  tripsList: {
    flex: 1,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tripEarning: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  tripDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  passengersList: {
    marginVertical: 10,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
  },
  passengersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#374151',
  },
  passengerItem: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  tripActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  acceptButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  acceptButtonDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.6,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  acceptedButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    opacity: 0.7,
  },
  acceptedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickupButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  pickupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noTripsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noTripsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  benefitsSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsList: {
    marginTop: 10,
  },
  benefitItem: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 5,
    lineHeight: 18,
  },
  // Trip status control styles
  tripStatusSection: {
    margin: 15,
  },
  activeTrip: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 5,
  },
  tripStatus: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 15,
  },
  statusButtonsContainer: {
    marginTop: 10,
  },
  statusActionButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  statusActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});