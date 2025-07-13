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
import axios from 'axios';
import io from 'socket.io-client';

// Change line 7 to use your computer's IP address
const API_URL = 'http://192.168.1.125:8081'; // Change this to your computer's IP
const REALTIME_URL = 'http://192.168.1.125:3001';

export default function DriverApp() {
  const [location, setLocation] = useState(null);
  const [driverId] = useState(4); // Sample driver ID
  const [isOnline, setIsOnline] = useState(false);
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [socket, setSocket] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, trips: 0 });

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
        vehicleInfo: {
          licensePlate: 'ABC123',
          make: 'Volvo',
          model: 'V70',
          wheelchairAccessible: false
        }
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
            setEarnings(prev => ({
              today: prev.today + 800,
              trips: prev.trips + 1
            }));
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

  const renderTripItem = ({ item }) => (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripTitle}>🚖 Delad resa</Text>
        <Text style={styles.tripEarning}>+800 SEK</Text>
      </View>
      
      <Text style={styles.tripDetail}>👥 {item.passengers?.length || 2} passagerare</Text>
      <Text style={styles.tripDetail}>📍 Upphämtning: Mölndal → Partille</Text>
      <Text style={styles.tripDetail}>⏰ Tid: {new Date().toLocaleTimeString('sv-SE')}</Text>
      
      <View style={styles.passengersList}>
        <Text style={styles.passengersTitle}>Passagerare:</Text>
        <Text style={styles.passengerItem}>• Anna, 75 år - Mölndal Centrum</Text>
        <Text style={styles.passengerItem}>• Erik, 68 år - Partille Station</Text>
      </View>

      <View style={styles.tripActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => acceptTrip(item.tripId)}
        >
          <Text style={styles.acceptButtonText}>✅ Acceptera</Text>
        </TouchableOpacity>
        
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
          <Text style={styles.benefitItem">• Högre intäkter per resa</Text>
          <Text style={styles.benefitItem">• Hjälper miljön genom färre bilresor</Text>
          <Text style={styles.benefitItem}>• Automatisk matchning av passagerare</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  acceptButtonText: {
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
});