import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { slotsService } from '../../services/slots';
import { Slot } from '../../types';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: slots,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['venueSlots', id],
    queryFn: () => slotsService.getByVenue(id!),
    enabled: !!id,
  });

  const handleSlotPress = (slot: Slot) => {
    if (slot.state === 'AVAILABLE' && !slot.match) {
      router.push({
        pathname: '/create-match',
        params: { slotId: slot.id },
      });
    } else if (slot.match) {
      router.push(`/match/${slot.match.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderSlotItem = ({ item }: { item: Slot }) => (
    <TouchableOpacity
      style={[
        styles.slotCard,
        item.state !== 'AVAILABLE' && styles.slotCardDisabled,
      ]}
      onPress={() => handleSlotPress(item)}
      disabled={item.state !== 'AVAILABLE' || !!item.match}
    >
      <View style={styles.slotHeader}>
        <Text style={styles.slotTime}>
          {formatDate(item.startTime)} - {formatDate(item.endTime)}
        </Text>
        <Text style={[styles.slotState, styles[`state${item.state}`]]}>
          {item.state}
        </Text>
      </View>
      {item.match && (
        <Text style={styles.matchInfo}>
          Match: {item.match.title}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading venue slots</Text>
      </View>
    );
  }

  const venue = slots?.[0]?.venue;

  return (
    <View style={styles.container}>
      {venue && (
        <View style={styles.venueHeader}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueAddress}>{venue.address}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Available Slots</Text>
      <FlatList
        data={slots || []}
        renderItem={renderSlotItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No slots available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueHeader: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  venueAddress: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  list: {
    padding: 15,
  },
  slotCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  slotCardDisabled: {
    opacity: 0.6,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  slotState: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stateAVAILABLE: {
    backgroundColor: '#34C759',
    color: '#fff',
  },
  statePENDING: {
    backgroundColor: '#FF9500',
    color: '#fff',
  },
  stateLOCKED: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  stateCOMPLETED: {
    backgroundColor: '#8E8E93',
    color: '#fff',
  },
  stateCANCELLED: {
    backgroundColor: '#FF3B30',
    color: '#fff',
  },
  matchInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});





