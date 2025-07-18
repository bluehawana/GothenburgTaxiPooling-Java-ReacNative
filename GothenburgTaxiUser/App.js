import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import io from 'socket.io-client';
import MapView, { Marker } from 'react-native-maps';

// Use your computer's IP address instead of localhost for testing on real device
const API_URL = 'http://192.168.2.71:8081'; // Updated to your current IP
const REALTIME_URL = 'http://192.168.2.71:3001'; // Real-time service

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [location, setLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [socket, setSocket] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
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
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      // Request notification permissions
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (notificationStatus !== 'granted') {
        Alert.alert('Notifieringstillstånd krävs för att få uppdateringar om din resa');
      }

      // Get initial location
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      
      // Get address from coordinates
      try {
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (address[0]) {
          const addr = address[0];
          const formattedAddress = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || 'Göteborg'}`.trim();
          setCurrentAddress(formattedAddress);
        }
      } catch (error) {
        console.log('Error getting address:', error);
        setCurrentAddress('Aktuell position tillgänglig');
      }

      // Initialize socket connection
      const socketConnection = io(REALTIME_URL);
      setSocket(socketConnection);

      // Connect as passenger
      socketConnection.emit('passenger-connect', { userId: tripData.userId });

      // Listen for driver assignment
      socketConnection.on('driver-assigned', (data) => {
        setTripDetails(data);
        setOrderStatus('driver_assigned');
        
        // Show notification
        Notifications.scheduleNotificationAsync({
          content: {
            title: '🚖 Förare tilldelad!',
            body: `Din resa har matchats. Förare: ${data.driverInfo?.licensePlate || 'Information kommer'}`,
            data: { type: 'driver_assigned' },
          },
          trigger: null,
        });

        Alert.alert(
          '🚖 Förare tilldelad!',
          `Din resa har matchats med en förare. Tryck på "Spåra resa" för att se din förares position.`,
          [{ text: 'OK', onPress: () => setShowTrackingModal(true) }]
        );
      });

      // Listen for driver location updates
      socketConnection.on('driver-location-update', (data) => {
        if (tripDetails && data.sharedTripId === tripDetails.sharedTripId) {
          setDriverLocation(data.location);
        }
      });

      // Listen for trip status updates
      socketConnection.on('trip-status-update', (data) => {
        setOrderStatus(data.status);
        
        let notificationTitle = '';
        let notificationBody = '';
        
        switch(data.status) {
          case 'pickup_confirmed':
            notificationTitle = '📍 Föraren är på väg!';
            notificationBody = `Din förare har bekräftat upphämtning. Beräknad ankomst: ${data.estimatedArrival || '15 minuter'}`;
            break;
          case 'arrived':
            notificationTitle = '🚖 Föraren har anlänt!';
            notificationBody = 'Din förare väntar utanför. Titta efter bilen med registreringsnummer: ' + (data.licensePlate || 'Se appen');
            break;
          case 'in_progress':
            notificationTitle = '🛣️ Resan pågår';
            notificationBody = 'Du är nu på väg till din destination. Ha en trevlig resa!';
            break;
          case 'completed':
            notificationTitle = '✅ Resa avslutad';
            notificationBody = 'Tack för att du reste med Göteborg Taxi! Vi hoppas du hade en bra resa.';
            break;
        }
        
        if (notificationTitle) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: notificationTitle,
              body: notificationBody,
              data: { type: 'status_update', status: data.status },
            },
            trigger: null,
          });
        }
      });

      return () => {
        socketConnection.disconnect();
      };
    })();
  }, []);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS-tillstånd krävs', 'Vi behöver tillgång till din position för att hjälpa dig.');
        setGettingLocation(false);
        return;
      }

      const newLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(newLocation);
      
      // Convert coordinates to address
      const address = await Location.reverseGeocodeAsync({
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
      });
      
      if (address[0]) {
        const addr = address[0];
        const formattedAddress = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || 'Göteborg'}`.trim();
        
        // Auto-fill pickup address
        setTripData(prev => ({
          ...prev,
          pickupAddress: formattedAddress
        }));
        
        setCurrentAddress(formattedAddress);
        Alert.alert('Position hittad!', `Din adress: ${formattedAddress}`);
      } else {
        Alert.alert('Adress hittades ej', 'Position hämtad men adress kunde inte bestämmas.');
        setTripData(prev => ({
          ...prev,
          pickupAddress: 'Min aktuella position'
        }));
      }
      
    } catch (error) {
      Alert.alert('GPS-fel', 'Kunde inte hämta din position. Kontrollera att GPS är aktivt.');
      console.error('Location error:', error);
    } finally {
      setGettingLocation(false);
    }
  };

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

  const renderTrackingModal = () => (
    <Modal
      visible={showTrackingModal}
      animationType="slide"
      onRequestClose={() => setShowTrackingModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🚖 Spåra din resa</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowTrackingModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {tripDetails && (
          <View style={styles.tripInfo}>
            <Text style={styles.tripInfoText}>
              📍 Status: {orderStatus === 'driver_assigned' ? 'Förare tilldelad' : 
                         orderStatus === 'pickup_confirmed' ? 'På väg till dig' :
                         orderStatus === 'arrived' ? 'Föraren har anlänt' :
                         orderStatus === 'in_progress' ? 'Resan pågår' : 'Uppdaterar...'}
            </Text>
            {tripDetails.driverInfo && (
              <>
                <Text style={styles.tripInfoText}>
                  🚗 Registreringsnummer: {tripDetails.driverInfo.licensePlate || 'Laddar...'}
                </Text>
                <Text style={styles.tripInfoText}>
                  📞 Telefon: {tripDetails.driverInfo.phoneNumber || 'Tillgänglig vid behov'}
                </Text>
                <Text style={styles.tripInfoText}>
                  🕐 Beräknad ankomst: {tripDetails.estimatedArrival || 'Beräknar...'}
                </Text>
              </>
            )}
          </View>
        )}

        {location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            followsUserLocation={true}
          >
            {/* User location marker */}
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Din position"
              description="Du är här"
              pinColor="blue"
            />
            
            {/* Driver location marker */}
            {driverLocation && (
              <Marker
                coordinate={{
                  latitude: driverLocation.latitude,
                  longitude: driverLocation.longitude,
                }}
                title="🚖 Din förare"
                description={`Registreringsnummer: ${tripDetails?.driverInfo?.licensePlate || 'Laddar...'}`}
                pinColor="yellow"
              />
            )}
          </MapView>
        )}
        
        <View style={styles.mapFooter}>
          <TouchableOpacity
            style={styles.refreshLocationButton}
            onPress={() => {
              // Refresh location and send to socket
              getCurrentLocation();
            }}
          >
            <Text style={styles.refreshLocationButtonText}>🔄 Uppdatera position</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          <Text style={styles.helpText}>
            💡 Tryck på 📍-knappen för att automatiskt fylla i din nuvarande adress
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upphämtningsadress</Text>
            <View style={styles.addressInputContainer}>
              <TextInput
                style={[styles.input, styles.addressInput]}
                placeholder="Ange din adress..."
                value={tripData.pickupAddress}
                onChangeText={(text) => setTripData({...tripData, pickupAddress: text})}
              />
              <TouchableOpacity
                style={[styles.locationButton, gettingLocation && styles.locationButtonActive]}
                onPress={getCurrentLocation}
                disabled={gettingLocation}
              >
                <Text style={styles.locationButtonText}>
                  {gettingLocation ? '🔄' : '📍'}
                </Text>
              </TouchableOpacity>
            </View>
            {currentAddress && (
              <Text style={styles.currentLocationText}>
                Aktuell position: {currentAddress}
              </Text>
            )}
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

        {/* Order Status Section */}
        {orderStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Resestatus</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {orderStatus === 'driver_assigned' ? '✅ Förare tilldelad - Din resa är matchad!' :
                 orderStatus === 'pickup_confirmed' ? '🚗 Föraren är på väg till dig' :
                 orderStatus === 'arrived' ? '📍 Föraren har anlänt - Gå ut och leta efter bilen' :
                 orderStatus === 'in_progress' ? '🛣️ Resan pågår - Ha en trevlig resa!' :
                 orderStatus === 'completed' ? '✅ Resa avslutad - Tack för att du reste med oss!' :
                 '🔄 Uppdaterar...'}
              </Text>
              
              {tripDetails && (
                <View style={styles.tripDetailsContainer}>
                  {tripDetails.driverInfo?.licensePlate && (
                    <Text style={styles.tripDetailText}>
                      🚗 Bil: {tripDetails.driverInfo.licensePlate}
                    </Text>
                  )}
                  {tripDetails.driverInfo?.phoneNumber && (
                    <Text style={styles.tripDetailText}>
                      📞 Telefon: {tripDetails.driverInfo.phoneNumber}
                    </Text>
                  )}
                  {tripDetails.estimatedArrival && (
                    <Text style={styles.tripDetailText}>
                      🕐 Ankomst: {tripDetails.estimatedArrival}
                    </Text>
                  )}
                </View>
              )}
              
              <TouchableOpacity
                style={styles.trackingButton}
                onPress={() => setShowTrackingModal(true)}
              >
                <Text style={styles.trackingButtonText}>🗺️ Spåra resa live</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
      
      {/* Tracking Modal */}
      {renderTrackingModal()}
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
  helpText: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: '#059669',
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
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    marginRight: 10,
  },
  locationButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonActive: {
    backgroundColor: '#1d4ed8',
  },
  locationButtonText: {
    fontSize: 20,
    color: 'white',
  },
  currentLocationText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 5,
    fontStyle: 'italic',
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
  // Status and tracking styles
  statusContainer: {
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: '#059669',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 10,
  },
  tripDetailsContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  tripDetailText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
  },
  trackingButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tripInfo: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripInfoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
  },
  map: {
    flex: 1,
    margin: 15,
    borderRadius: 8,
  },
  mapFooter: {
    padding: 15,
    backgroundColor: 'white',
  },
  refreshLocationButton: {
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshLocationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});