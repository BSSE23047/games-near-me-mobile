import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { matchesService } from '../../services/matches';
import { participantsService } from '../../services/participants';
import { Match, MatchParticipant } from '../../types';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const {
    data: match,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesService.getById(id!),
    enabled: !!id,
  });

  const {
    data: participants,
    isLoading: isLoadingParticipants,
  } = useQuery({
    queryKey: ['matchParticipants', id],
    queryFn: () => participantsService.getByMatch(id!),
    enabled: !!id,
  });

  const { mutate: joinMatch, isPending: isJoining } = useMutation({
    mutationFn: participantsService.join,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchParticipants', id] });
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      Alert.alert('Success', 'Join request sent');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to join match';
      Alert.alert('Error', errorMessage);
    },
  });

  const { mutate: toggleVisibility, isPending: isToggling } = useMutation({
    mutationFn: matchesService.toggleVisibility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      queryClient.invalidateQueries({ queryKey: ['publicMatches'] });
      Alert.alert('Success', 'Match visibility updated');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update visibility';
      Alert.alert('Error', errorMessage);
    },
  });

  const handleJoin = () => {
    if (!id) return;
    joinMatch({ matchId: id });
  };

  const handleToggleVisibility = () => {
    if (!id) return;
    toggleVisibility(id);
  };

  const isHost = user?.id === match?.hostId;
  const hasJoined = participants?.some((p) => p.playerId === user?.id);
  const canJoin = !isHost && !hasJoined && match?.state === 'APPROVED';

  const renderParticipant = ({ item }: { item: MatchParticipant }) => (
    <View style={styles.participantItem}>
      <Text style={styles.participantName}>
        {item.player?.name || item.player?.email || 'Unknown'}
      </Text>
      <Text style={[styles.participantState, styles[`state${item.state}`]]}>
        {item.state}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading match</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{match.title}</Text>
        {match.description && (
          <Text style={styles.description}>{match.description}</Text>
        )}
        <View style={styles.matchInfo}>
          <Text style={styles.infoText}>
            Players: {participants?.length || 0}/{match.maxPlayers}
          </Text>
          <Text style={[styles.state, styles[`state${match.state}`]]}>
            {match.state}
          </Text>
        </View>
        <Text style={styles.visibility}>
          {match.visibility === 'PUBLIC' ? '🌐 Public' : '🔒 Private'}
        </Text>
      </View>

      {isHost && match.state === 'APPROVED' && match.visibility === 'PRIVATE' && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={handleToggleVisibility}
          disabled={isToggling}
        >
          <Text style={styles.toggleButtonText}>
            {isToggling ? 'Updating...' : 'Make Match Public'}
          </Text>
        </TouchableOpacity>
      )}

      {canJoin && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoin}
          disabled={isJoining}
        >
          <Text style={styles.joinButtonText}>
            {isJoining ? 'Joining...' : 'Join Match'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Participants</Text>
      {isLoadingParticipants ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={participants || []}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No participants yet</Text>
          }
        />
      )}
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
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  matchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  state: {
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
  visibility: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#34C759',
    margin: 15,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantName: {
    fontSize: 16,
    flex: 1,
  },
  participantState: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stateREQUESTED: {
    backgroundColor: '#FF9500',
    color: '#fff',
  },
  stateAPPROVED: {
    backgroundColor: '#34C759',
    color: '#fff',
  },
  stateCHECKED_IN: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  stateREJECTED: {
    backgroundColor: '#FF3B30',
    color: '#fff',
  },
  stateLEFT: {
    backgroundColor: '#8E8E93',
    color: '#fff',
  },
  loader: {
    margin: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
});




