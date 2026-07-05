import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { matchesService } from '../services/matches';
import { Match } from '../types';

export default function MyMatchesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const {
    data: publicMatches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['publicMatches'],
    queryFn: () => matchesService.getPublic(),
  });

  // Filter matches where user is host or participant
  const myMatches = publicMatches?.filter((match) => {
    const isHost = match.hostId === user?.id;
    const isParticipant = match.participants?.some(
      (p) => p.playerId === user?.id
    );
    return isHost || isParticipant;
  });

  const handleMatchPress = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    const isHost = item.hostId === user?.id;
    const userParticipant = item.participants?.find(
      (p) => p.playerId === user?.id
    );

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => handleMatchPress(item.id)}
      >
        <View style={styles.matchHeader}>
          <Text style={styles.matchTitle}>{item.title}</Text>
          {isHost && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>HOST</Text>
            </View>
          )}
        </View>
        {item.description && (
          <Text style={styles.matchDescription}>{item.description}</Text>
        )}
        <View style={styles.matchInfo}>
          <Text style={styles.matchInfoText}>
            {item.participants?.length || 0}/{item.maxPlayers} players
          </Text>
          <Text style={[styles.matchState, styles[`state${item.state}`]]}>
            {item.state}
          </Text>
        </View>
        {userParticipant && (
          <Text style={styles.participantStatus}>
            Your status: {userParticipant.state}
          </Text>
        )}
        {item.slot?.venue && (
          <Text style={styles.venueName}>{item.slot.venue.name}</Text>
        )}
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.errorText}>Error loading matches</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Matches</Text>
      <FlatList
        data={myMatches || []}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't joined any matches yet</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/home')}
            >
              <Text style={styles.browseButtonText}>Browse Matches</Text>
            </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  list: {
    padding: 15,
  },
  matchCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  hostBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hostBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  matchDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  matchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  matchInfoText: {
    fontSize: 14,
    color: '#666',
  },
  matchState: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stateAPPROVED: {
    backgroundColor: '#34C759',
    color: '#fff',
  },
  stateREQUESTED: {
    backgroundColor: '#FF9500',
    color: '#fff',
  },
  participantStatus: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
    fontWeight: '600',
  },
  venueName: {
    fontSize: 12,
    color: '#999',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});





