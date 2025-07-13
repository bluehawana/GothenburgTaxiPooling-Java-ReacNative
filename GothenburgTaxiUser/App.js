import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import axios from 'axios';

// Use your computer's IP address instead of localhost for testing on real device
const API_URL = 'http://192.168.1.125:8081'; // Change this to your computer's IP

export default function App() {
  const [location, setLocation] = useState(null);
  const [tripData, setTripData] = useState({
    userId: 1,
    pickupAddress: '',
    destinationAddress: '',
    requestedPickupTime: '',
    passengerCount: 1,
    needsWheelchairAccess: false,
    needsAssistance: false,
    specialRequirements: '',
    priority: 'NORMAL'
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
  }, []);

  const handleBookTrip = async () => {
    if (!tripData.pickupAddress || !tripData.destinationAddress) {
      Alert.alert('Error', 'Fyll i både upphämtnings- och destinationsadress');
      return;
    }

    setIsLoading(true);
    
    try {
      setMessage('Skickar bokningsförfrågan...');
      const response = await axios.post(`${API_URL}/api/trips/book`, {
        ...tripData,
        pickupLatitude: location?.coords.latitude || 57.7089,
        pickupLongitude: location?.coords.longitude || 11.9746,
        destinationLatitude: 57.7089,
        destinationLongitude: 11.9746,
        requestedPickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      
      setMessage('✅ Resa bokad framgångsrikt!');
      Alert.alert('Framgång', 'Din resa har bokats! Du kommer att få besked om matchning inom kort.');
      
      // Reset form
      setTripData({
        ...tripData,
        pickupAddress: '',
        destinationAddress: '',
        specialRequirements: ''
      });
    } catch (error) {
      setMessage('❌ Fel vid bokning');
      Alert.alert('Fel', 'Kunde inte boka resan. Kontrollera internetanslutning.');
      console.error('Booking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🚖 Göteborg Taxi</Text>
          <Text style={styles.subtitle}>Samåkning för äldre, funktionsnedsatta och patienter</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Resesinfo</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upphämtningsadress</Text>
            <TextInput
              style={styles.input}
              placeholder="Ange din adress..."
              value={tripData.pickupAddress}
              onChangeText={(text) => setTripData({...tripData, pickupAddress: text})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination</Text>
            <TextInput
              style={styles.input}
              placeholder="Vart ska du åka..."
              value={tripData.destinationAddress}
              onChangeText={(text) => setTripData({...tripData, destinationAddress: text})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Antal passagerare</Text>
            <View style={styles.passengerButtons}>
              {[1, 2, 3].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.passengerButton,
                    tripData.passengerCount === num && styles.passengerButtonActive
                  ]}
                  onPress={() => setTripData({...tripData, passengerCount: num})}
                >
                  <Text style={[
                    styles.passengerButtonText,
                    tripData.passengerCount === num && styles.passengerButtonTextActive
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>♿ Särskilda behov</Text>
          
          <TouchableOpacity
            style={[styles.checkbox, tripData.needsWheelchairAccess && styles.checkboxActive]}
            onPress={() => setTripData({...tripData, needsWheelchairAccess: !tripData.needsWheelchairAccess})}
          >
            <Text style={styles.checkboxText}>
              {tripData.needsWheelchairAccess ? '✅' : '⬜'} Rullstolstillgänglig bil
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkbox, tripData.needsAssistance && styles.checkboxActive]}
            onPress={() => setTripData({...tripData, needsAssistance: !tripData.needsAssistance})}
          >
            <Text style={styles.checkboxText}>
              {tripData.needsAssistance ? '✅' : '⬜'} Behöver assistans
            </Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ytterligare önskemål</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ange eventuella särskilda önskemål..."
              value={tripData.specialRequirements}
              onChangeText={(text) => setTripData({...tripData, specialRequirements: text})}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Kostnadsbesparing</Text>
          <View style={styles.costComparison}>
            <View style={styles.costBox}>
              <Text style={styles.costTitle}>Individuell resa</Text>
              <Text style={styles.costAmount}>650 SEK</Text>
              <Text style={styles.costDesc}>per person</Text>
            </View>
            <View style={styles.costBoxGreen}>
              <Text style={styles.costTitle}>Delad resa</Text>
              <Text style={styles.costAmount}>800 SEK</Text>
              <Text style={styles.costDesc}>för 2-3 personer</Text>
              <Text style={styles.savings}>Upp till 75% besparing!</Text>
            </View>
          </View>
        </View>

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={[styles.bookButton, isLoading && styles.bookButtonDisabled]} 
          onPress={handleBookTrip}
          disabled={isLoading}
        >
          <Text style={styles.bookButtonText}>
            {isLoading ? '📱 Bokar...' : '🚖 Boka resa (24h i förväg)'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Din position: {location ? 
              `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : 
              'Hämtar...'}
          </Text>
          <Text style={styles.footerText}>
            API: {API_URL}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 28,
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
  section: {
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  passengerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  passengerButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  passengerButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  passengerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  passengerButtonTextActive: {
    color: 'white',
  },
  checkbox: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checkboxActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  checkboxText: {
    fontSize: 16,
    color: '#374151',
  },
  costComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costBox: {
    flex: 1,
    backgroundColor: '#fef2f2',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  costBoxGreen: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  costTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  costAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  costDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  savings: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 5,
  },
  messageBox: {
    backgroundColor: '#eff6ff',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  messageText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#1e40af',
  },
  bookButton: {
    backgroundColor: '#059669',
    margin: 15,
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});