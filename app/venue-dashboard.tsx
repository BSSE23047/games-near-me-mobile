import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { matchesService } from '../services/matches';
import { venuesService } from '../services/venues';
import { Match, Venue, Slot } from '../types';

type VenueWithSlots = Venue & { slots?: Slot[] };

export default function VenueDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Pending match requests for THIS venue owner's venues only
  const {
    data: pendingMatches = [],
    isLoading: isLoadingPending,
  } = useQuery({
    queryKey: ['pendingMatchesForOwner'],
    queryFn: () => matchesService.getPendingForOwner(),
    enabled: user?.role === 'VENUE_OWNER',
  });

  // My venues with slots and matches (for schedule and stats)
  const { data: myVenues = [] } = useQuery({
    queryKey: ['myVenues'],
    queryFn: () => venuesService.getMine(),
    enabled: user?.role === 'VENUE_OWNER',
  });

  const venuesWithSlots = myVenues as VenueWithSlots[];

  const { mutate: approveMatch, isPending: isApproving } = useMutation({
    mutationFn: ({ id, state }: { id: string; state: 'APPROVED' | 'REJECTED' }) =>
      matchesService.approveReject(id, { state }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingMatchesForOwner'] });
      queryClient.invalidateQueries({ queryKey: ['myVenues'] });
      queryClient.invalidateQueries({ queryKey: ['publicMatches'] });
      Alert.alert('Success', 'Match status updated');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error
        ? error.message
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update match';
      Alert.alert('Error', errorMessage);
    },
  });

  const handleApprove = (matchId: string) => {
    Alert.alert(
      'Approve Match',
      'Are you sure you want to approve this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => approveMatch({ id: matchId, state: 'APPROVED' }),
        },
      ]
    );
  };

  const handleReject = (matchId: string) => {
    Alert.alert(
      'Reject Match',
      'Are you sure you want to reject this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => approveMatch({ id: matchId, state: 'REJECTED' }),
        },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatScheduleTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const totalSlotsCount = venuesWithSlots.reduce(
    (sum, v) => sum + (v.slots?.length ?? 0),
    0
  );

  const approvedSlotsCount = venuesWithSlots.reduce(
    (sum, v) =>
      sum +
      (v.slots?.filter((s) => s.match && s.match.state === 'APPROVED').length ?? 0),
    0
  );

  const now = new Date();
  const scheduleItems = venuesWithSlots.flatMap((venue) =>
    (venue.slots ?? [])
      .filter((slot) => slot.match && slot.match.state === 'APPROVED' && new Date(slot.startTime) >= now)
      .map((slot) => ({ slot, match: slot.match!, venue }))
  );
  scheduleItems.sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Tonight';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderPendingMatch = ({ item }: { item: Match }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchImagePlaceholder}>
        <Ionicons name="football" size={48} color="#8E8E93" />
      </View>
      <View style={styles.matchContent}>
        <View style={styles.matchHeader}>
          <View style={styles.matchTag}>
            <Text style={styles.matchTagText} numberOfLines={1}>
              {item.slot?.venue?.name || 'Venue'}
            </Text>
          </View>
        </View>
        <Text style={styles.matchTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.matchTime}>
          {formatDate(item.slot?.startTime || item.createdAt)}, {formatTime(item.slot?.startTime || item.createdAt)}
        </Text>
        <Text style={styles.matchHost}>
          Host: {item.host?.name || item.host?.email || 'Unknown'}
        </Text>
        <Text style={styles.matchParticipantsText}>
          {item.participants?.length ?? 0} / {item.maxPlayers} players
        </Text>
        <View style={styles.matchActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleReject(item.id)}
            disabled={isApproving}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
            disabled={isApproving}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (user?.role !== 'VENUE_OWNER') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Access denied. Venue owner only.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.venueIcon}>
            <Ionicons name="business" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.venueLabel}>Venue Owner</Text>
            <Text style={styles.venueName}>{user.name || 'Arena 51'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push('/home')}
          >
            <Ionicons name="compass-outline" size={24} color="#fff" />
            <Text style={styles.headerIconLabel}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={24} color="#fff" />
            <Text style={styles.headerIconLabel}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBadge}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{greeting},</Text>
        <Text style={styles.greetingSubtext}>{user?.name || 'Venue Owner'} • Ready for action?</Text>
      </View>

      {/* Action Required Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Action Required</Text>
          {pendingMatches.length > 0 && (
            <Text style={styles.pendingBadge}>{pendingMatches.length} pending</Text>
          )}
        </View>
        {isLoadingPending ? (
          <ActivityIndicator style={styles.loader} color="#007AFF" />
        ) : pendingMatches.length > 0 ? (
          <FlatList
            data={pendingMatches}
            renderItem={renderPendingMatch}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending match requests</Text>
          </View>
        )}
      </View>

      {/* Performance / Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceLabel}>MY VENUES</Text>
            <Text style={styles.performanceValue}>{venuesWithSlots.length}</Text>
          </View>

          <View style={[styles.performanceCard, styles.performanceCardBlue]}>
            <Text style={styles.performanceLabelWhite}>PENDING</Text>
            <Text style={styles.performanceValueWhite}>{pendingMatches.length}</Text>
            <Text style={styles.performanceSubtextWhite}>awaiting approval</Text>
          </View>

          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceLabel}>TOTAL SLOTS</Text>
              <Ionicons name="layers-outline" size={20} color="#8E8E93" />
            </View>
            <Text style={styles.performanceValue}>{totalSlotsCount}</Text>
          </View>

          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceLabel}>BOOKED</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
            </View>
            <Text style={styles.performanceValue}>{approvedSlotsCount}</Text>
          </View>
        </View>
      </View>

      {/* Upcoming Schedule Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
        </View>
        {scheduleItems.length > 0 ? (
          <View style={styles.scheduleList}>
            {scheduleItems.map((entry) => (
              <TouchableOpacity
                key={entry.slot.id}
                style={styles.scheduleItem}
                onPress={() => router.push(`/match/${entry.match.id}`)}
              >
                <Text style={styles.scheduleTime}>{formatScheduleTime(entry.slot.startTime)}</Text>
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTitle}>
                    {entry.match.title}
                    <Text style={styles.scheduleDot}> •</Text>
                  </Text>
                  <Text style={styles.scheduleSubtext}>
                    {entry.venue.name} • {entry.match.host?.name || entry.match.host?.email || 'Host'} • {entry.match.maxPlayers} players
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming approved matches</Text>
          </View>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-slot')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E27',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  venueIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    alignItems: 'center',
  },
  headerIconLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  venueLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  pendingBadge: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  notificationBadge: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  greeting: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  greetingSubtext: {
    fontSize: 20,
    color: '#007AFF',
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  calendarIcon: {
    fontSize: 20,
  },
  matchesList: {
    paddingRight: 20,
  },
  matchCard: {
    width: 300,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
  },
  matchImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchContent: {
    padding: 15,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  matchTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  matchHost: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  matchParticipantsText: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 12,
  },
  matchParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  participantCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#fff',
  },
  declineButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  performanceCard: {
    width: '47%',
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 12,
  },
  performanceCardBlue: {
    backgroundColor: '#007AFF',
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  performanceLabelWhite: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  performanceValueWhite: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  performanceSubtextWhite: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  performanceSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  trendBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  performanceIcon: {
    fontSize: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#007AFF80',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  scheduleList: {
    gap: 15,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 12,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#8E8E93',
    width: 70,
  },
  scheduleContent: {
    flex: 1,
    marginLeft: 15,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  scheduleDot: {
    color: '#34C759',
  },
  scheduleSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  scheduleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  loader: {
    margin: 20,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
