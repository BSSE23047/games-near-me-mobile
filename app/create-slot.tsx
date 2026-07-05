import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { slotsService } from '../services/slots';
import { venuesService } from '../services/venues';
import { useAuthStore } from '../store/authStore';
import { Venue } from '../types';

export default function CreateSlotScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const { data: myVenues = [], isLoading: isLoadingVenues } = useQuery({
    queryKey: ['myVenues'],
    queryFn: () => venuesService.getMine(),
  });

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venueId, setVenueId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(0);
    return d;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    d.setMinutes(0);
    return d;
  });
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  const { mutate: createSlot, isPending } = useMutation({
    mutationFn: slotsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venueSlots'] });
      queryClient.invalidateQueries({ queryKey: ['myVenues'] });
      Alert.alert('Success', 'Slot created successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/venue-dashboard'),
        },
      ]);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Failed to create slot';
      if (status === 401) {
        Alert.alert(
          'Session expired',
          'Please log in again to create slots.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return;
      }
      Alert.alert('Error', String(message));
    },
  });

  const handleSubmit = () => {
    const id = selectedVenue?.id || venueId.trim();
    if (!id) {
      Alert.alert('Error', 'Please select a venue or add one first.');
      return;
    }

    if (!token) {
      Alert.alert('Login required', 'Please log in again to create slots.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    createSlot({
      venueId: id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    });
  };

  const onSuccessCreate = () => {
    queryClient.invalidateQueries({ queryKey: ['myVenues'] });
  };

  const formatDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      {/* Header with Back */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/venue-dashboard')}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Time Slot</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Select venue *</Text>
        {isLoadingVenues ? (
          <ActivityIndicator color="#007AFF" style={styles.loader} />
        ) : myVenues.length === 0 ? (
          <View style={styles.emptyVenues}>
            <Text style={styles.emptyVenuesText}>You have no venues yet.</Text>
            <Text style={styles.emptyVenuesHint}>Add a venue first, then you can create slots.</Text>
            <TouchableOpacity
              style={styles.addVenueButton}
              onPress={() => router.push('/add-venue')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addVenueButtonText}>Add venue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.venueList}>
            {myVenues.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.venueItem, selectedVenue?.id === v.id && styles.venueItemSelected]}
                onPress={() => {
                  setSelectedVenue(v);
                  setVenueId(v.id);
                }}
              >
                <Ionicons
                  name="business"
                  size={22}
                  color={selectedVenue?.id === v.id ? '#007AFF' : '#8E8E93'}
                />
                <View style={styles.venueItemText}>
                  <Text style={styles.venueItemName}>{v.name}</Text>
                  <Text style={styles.venueItemAddress}>{v.address}</Text>
                </View>
                {selectedVenue?.id === v.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Start date & time *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowStartDate(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#007AFF" style={styles.pickerIcon} />
          <Text style={styles.pickerButtonText}>{formatDate(startDate)}</Text>
        </TouchableOpacity>
        {showStartDate && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowStartDate(Platform.OS === 'ios');
              if (selected) setStartDate(selected);
            }}
            minimumDate={new Date()}
          />
        )}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowStartTime(true)}
        >
          <Ionicons name="time-outline" size={20} color="#007AFF" style={styles.pickerIcon} />
          <Text style={styles.pickerButtonText}>{formatTime(startDate)}</Text>
        </TouchableOpacity>
        {showStartTime && (
          <DateTimePicker
            value={startDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowStartTime(Platform.OS === 'ios');
              if (selected) setStartDate(selected);
            }}
          />
        )}

        <Text style={styles.label}>End date & time *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowEndDate(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#007AFF" style={styles.pickerIcon} />
          <Text style={styles.pickerButtonText}>{formatDate(endDate)}</Text>
        </TouchableOpacity>
        {showEndDate && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowEndDate(Platform.OS === 'ios');
              if (selected) setEndDate(selected);
            }}
            minimumDate={startDate}
          />
        )}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowEndTime(true)}
        >
          <Ionicons name="time-outline" size={20} color="#007AFF" style={styles.pickerIcon} />
          <Text style={styles.pickerButtonText}>{formatTime(endDate)}</Text>
        </TouchableOpacity>
        {showEndTime && (
          <DateTimePicker
            value={endDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowEndTime(Platform.OS === 'ios');
              if (selected) setEndDate(selected);
            }}
          />
        )}

        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Slot</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  pickerIcon: {
    marginRight: 10,
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
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 5,
    marginBottom: 10,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  pickerButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 16,
  },
  emptyVenues: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyVenuesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyVenuesHint: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  addVenueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  addVenueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  venueList: {
    marginBottom: 8,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  venueItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  venueItemText: {
    flex: 1,
    marginLeft: 12,
  },
  venueItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  venueItemAddress: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
});
