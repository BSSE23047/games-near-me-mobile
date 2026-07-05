import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { matchesService } from '../services/matches';
import { venuesService } from '../services/venues';
import { slotsService } from '../services/slots';
import { Venue, Slot } from '../types';

type Step = 1 | 2 | 3;

function formatSlotTime(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${s.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} – ${e.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

export default function CreateMatchScreen() {
  const { slotId: paramSlotId } = useLocalSearchParams<{ slotId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(() => (paramSlotId ? 3 : 1));
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const slotId = paramSlotId || selectedSlot?.id || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [isPrivate, setIsPrivate] = useState(true);

  const { data: venues = [], isLoading: loadingVenues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => venuesService.getAll(),
    enabled: step === 1 && !paramSlotId,
  });

  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['venueSlots', selectedVenue?.id],
    queryFn: () => slotsService.getByVenue(selectedVenue!.id),
    enabled: step >= 2 && !!selectedVenue?.id,
  });

  const availableSlots = useMemo(
    () => slots.filter((s) => s.state === 'AVAILABLE' && !s.match),
    [slots]
  );

  const { mutate: createMatch, isPending } = useMutation({
    mutationFn: matchesService.request,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['publicMatches'] });
      Alert.alert('Success', 'Match requested successfully', [
        {
          text: 'OK',
          onPress: () => router.push(`/match/${data.id}`),
        },
      ]);
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to create match';
      Alert.alert('Error', errorMessage);
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a match title');
      return;
    }
    const maxPlayersNum = parseInt(maxPlayers, 10);
    if (isNaN(maxPlayersNum) || maxPlayersNum < 2) {
      Alert.alert('Error', 'Max players must be at least 2');
      return;
    }
    if (!slotId) {
      Alert.alert('Error', 'Please select a venue and slot first');
      return;
    }
    createMatch({
      slotId,
      title: title.trim(),
      description: description.trim() || undefined,
      maxPlayers: maxPlayersNum,
    });
  };

  const handleBack = () => {
    if (step === 2) {
      setSelectedVenue(null);
      setSelectedSlot(null);
      setStep(1);
    } else if (step === 3 && !paramSlotId) {
      setSelectedSlot(null);
      setStep(2);
    } else {
      router.back();
    }
  };

  // —— Step 1: Select Venue ——
  if (step === 1 && !paramSlotId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Host a match</Text>
          <Text style={styles.stepSubtitle}>Choose a venue</Text>
        </View>
        {loadingVenues ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : venues.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No venues available yet.</Text>
          </View>
        ) : (
          <FlatList
            data={venues}
            keyExtractor={(v) => v.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedVenue(item);
                  setStep(2);
                }}
              >
                <Ionicons name="business" size={24} color="#007AFF" />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>{item.address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // —— Step 2: Select Slot ——
  if (step === 2 && selectedVenue) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedVenue.name}</Text>
          <Text style={styles.stepSubtitle}>Choose a time slot</Text>
        </View>
        {loadingSlots ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : availableSlots.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              No available slots at this venue. Try another venue or check back later.
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableSlots}
            keyExtractor={(s) => s.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedSlot(item);
                  setStep(3);
                }}
              >
                <Ionicons name="time" size={24} color="#007AFF" />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>
                    {formatSlotTime(item.startTime, item.endTime)}
                  </Text>
                  <Text style={styles.cardSubtitle}>{item.state}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // —— Step 3: Match details form ——
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Match</Text>
        {selectedSlot && (
          <Text style={styles.stepSubtitle}>
            {formatSlotTime(selectedSlot.startTime, selectedSlot.endTime)}
            {selectedVenue && ` · ${selectedVenue.name}`}
          </Text>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.formContent}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter match title"
          placeholderTextColor="#8E8E93"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter match description (optional)"
          placeholderTextColor="#8E8E93"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Max Players *</Text>
        <TextInput
          style={styles.input}
          placeholder="10"
          placeholderTextColor="#8E8E93"
          value={maxPlayers}
          onChangeText={setMaxPlayers}
          keyboardType="numeric"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Private Match</Text>
          <TouchableOpacity
            style={[styles.switch, isPrivate && styles.switchOn]}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <Text style={styles.switchText}>{isPrivate ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {isPrivate
            ? 'Match will be private (invite-only) initially. You can make it public later.'
            : 'Match will be public and visible to everyone.'}
        </Text>

        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Request Match</Text>
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
    marginBottom: 8,
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
  stepSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardText: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  formContent: {
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  switch: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  switchOn: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  switchText: {
    color: '#fff',
    fontSize: 14,
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
});
