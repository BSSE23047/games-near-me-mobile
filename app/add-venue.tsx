import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { venuesService } from '../services/venues';
import { useAuthStore } from '../store/authStore';

const DEFAULT_REGION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function AddVenueScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [markerCoords, setMarkerCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapConfirmLoading, setMapConfirmLoading] = useState(false);

  const { mutate: createVenue, isPending } = useMutation({
    mutationFn: venuesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myVenues'] });
      Alert.alert('Success', 'Venue added successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/create-slot'),
        },
      ]);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Failed to add venue';
      if (status === 401) {
        Alert.alert(
          'Session expired',
          'Please log in again.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return;
      }
      Alert.alert('Error', String(message));
    },
  });

  const applyLocation = useCallback(
    async (lat: number, lng: number, fillAddress = true) => {
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      if (fillAddress) {
        try {
          const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (result) {
            const parts = [
              result.streetNumber,
              result.street,
              result.district,
              result.city,
              result.region,
              result.postalCode,
              result.country,
            ].filter(Boolean);
            setAddress(parts.join(', ') || address);
          }
        } catch {
          // keep existing address if reverse geocode fails
        }
      }
    },
    [address]
  );

  const handleUseMyLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location required',
          'Please allow location access to use "Use my location". You can still enter address and coordinates manually or pick on map.'
        );
        setLocationLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = location.coords;
      await applyLocation(lat, lng, true);
    } catch (e) {
      Alert.alert(
        'Location error',
        'Could not get your location. Try "Pick on map" or enter coordinates manually.'
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const openMapPicker = async () => {
    setMapVisible(true);
    setMarkerCoords(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        const { latitude: lat, longitude: lng } = location.coords;
        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setMarkerCoords({ latitude: lat, longitude: lng });
      } else {
        setMapRegion(DEFAULT_REGION);
        setMarkerCoords({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
      }
    } catch {
      setMapRegion(DEFAULT_REGION);
      setMarkerCoords({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
    }
  };

  const handleMapConfirm = async () => {
    if (!markerCoords) return;
    setMapConfirmLoading(true);
    try {
      await applyLocation(markerCoords.latitude, markerCoords.longitude, true);
      setMapVisible(false);
    } finally {
      setMapConfirmLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter venue name');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter address');
      return;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Please set location using "Use my location" or "Pick on map", or enter latitude and longitude.');
      return;
    }

    // Refresh the JWT so the backend gets a valid access token
    const refreshed = await useAuthStore.getState().refreshSession();
    if (!refreshed) {
      Alert.alert('Session expired', 'Please log in again.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }

    const accessToken = useAuthStore.getState().token;
    if (!accessToken) {
      Alert.alert('Session expired', 'Please log in again.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }

    createVenue(
      {
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lng,
      },
      accessToken
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Venue</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Venue name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Central Sports Complex"
          placeholderTextColor="#8E8E93"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Full address (manual or from map)"
          placeholderTextColor="#8E8E93"
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <Text style={styles.label}>Location (for accuracy)</Text>
        <View style={styles.locationRow}>
          <TouchableOpacity
            style={[styles.locationButton, locationLoading && styles.buttonDisabled]}
            onPress={handleUseMyLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="locate" size={20} color="#fff" />
                <Text style={styles.locationButtonText}>Use my location</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationButton} onPress={openMapPicker}>
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.locationButtonText}>Pick on map</Text>
          </TouchableOpacity>
        </View>

        {(latitude !== '' || longitude !== '') && (
          <>
            <Text style={styles.label}>Latitude / Longitude</Text>
            <View style={styles.coordsRow}>
              <TextInput
                style={[styles.input, styles.coordInput]}
                placeholder="Latitude"
                placeholderTextColor="#8E8E93"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.coordInput]}
                placeholder="Longitude"
                placeholderTextColor="#8E8E93"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="decimal-pad"
              />
            </View>
          </>
        )}

        <Text style={styles.hint}>
          Use "Use my location" or "Pick on map" for accurate coordinates. Address can be edited manually.
        </Text>

        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Venue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pick location on map</Text>
            <TouchableOpacity onPress={() => setMapVisible(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <MapView
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            onPress={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
          >
            {markerCoords && (
              <Marker
                coordinate={markerCoords}
                draggable
                onDragEnd={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>
          <View style={styles.modalFooter}>
            <Text style={styles.modalHint}>Tap the map or drag the marker to set the venue location.</Text>
            <TouchableOpacity
              style={[styles.confirmButton, (!markerCoords || mapConfirmLoading) && styles.buttonDisabled]}
              onPress={handleMapConfirm}
              disabled={!markerCoords || mapConfirmLoading}
            >
              {mapConfirmLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm location</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordInput: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalClose: {
    color: '#007AFF',
    fontSize: 16,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  modalHint: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
