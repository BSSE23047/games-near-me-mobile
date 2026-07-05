import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { matchesService } from '../services/matches';
import { Match } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [selectedSport, setSelectedSport] = useState<string>('All');

  const {
    data: matches,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['publicMatches'],
    queryFn: () => matchesService.getPublic(),
    retry: 1,
    retryDelay: 1000,
  });

  // Refetch when user navigates to Discover (e.g. after approving a match on dashboard)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleMatchPress = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Tonight, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  };

  const getPlayerStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 80) return { text: 'FILLING FAST', color: '#FF3B30' };
    if (percentage >= 50) return { text: 'Half full', color: '#007AFF' };
    if (current === 0) return { text: 'Open', color: '#34C759' };
    return { text: `${max - current} spots left`, color: '#007AFF' };
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    const currentPlayers = item.participants?.length || 0;
    const status = getPlayerStatus(currentPlayers, item.maxPlayers);
    const progress = (currentPlayers / item.maxPlayers) * 100;

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => handleMatchPress(item.id)}
      >
        <View style={styles.matchImageContainer}>
          <View style={styles.matchImagePlaceholder}>
            <Ionicons name="football" size={48} color="#8E8E93" />
          </View>
          <View style={styles.matchImageOverlay}>
            <Text style={styles.matchLocation}>
              {item.slot?.venue?.name || 'Venue'}
            </Text>
            <View style={styles.matchTags}>
              <View style={styles.matchTag}>
                <Text style={styles.matchTagText}>
                  {item.maxPlayers}V{item.maxPlayers}
                </Text>
              </View>
              {status.text === 'FILLING FAST' && (
                <View style={[styles.matchTag, styles.matchTagRed]}>
                  <Text style={styles.matchTagTextRed}>{status.text}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.matchDetails}>
          <View style={styles.matchTimeRow}>
            <Ionicons name="time-outline" size={18} color="#8E8E93" style={styles.matchTimeIcon} />
            <Text style={styles.matchTime}>
              {formatTime(item.slot?.startTime || item.createdAt)}
            </Text>
          </View>

          <View style={styles.matchPlayersRow}>
            <Text style={styles.matchPlayers}>
              {currentPlayers}/{item.maxPlayers} Players
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: progress >= 80 ? '#FF3B30' : progress >= 50 ? '#FF9500' : '#007AFF',
                  },
                ]}
              />
            </View>
          </View>

          <Text style={[styles.matchStatus, { color: status.color }]}>
            {status.text}
          </Text>

          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleMatchPress(item.id)}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const sports = ['All', 'Basketball', 'Soccer', 'Tennis', 'Football'];

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as { message?: string })?.message || 'Unknown error';
    
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading matches</Text>
        <Text style={styles.errorDetail}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>Lahore, PK</Text>
            <Text style={styles.locationChevron}>▼</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sport Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {sports.map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.filterButton,
              selectedSport === sport && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedSport === sport && styles.filterButtonTextActive,
              ]}
            >
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Happening Today Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Happening Today</Text>
        <TouchableOpacity>
          <Text style={styles.viewMapText}>View map</Text>
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      <FlatList
        data={matches || []}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#007AFF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matches available</Text>
          </View>
        }
      />

      {/* FAB for Venue Owners */}
      {user?.role === 'VENUE_OWNER' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/create-slot')}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="compass" size={24} color="#007AFF" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/my-matches')}
        >
          <Ionicons name="calendar-outline" size={24} color="#8E8E93" />
          <Text style={styles.navLabel}>My Matches</Text>
        </TouchableOpacity>
        {user?.role === 'VENUE_OWNER' ? (
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/venue-dashboard')}
          >
            <View style={styles.navFab}>
              <Ionicons name="grid" size={24} color="#fff" />
            </View>
            <Text style={styles.navLabel}>Dashboard</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/create-match')}
          >
            <View style={styles.navFab}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
            <Text style={styles.navLabel}>Add</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble-outline" size={24} color="#8E8E93" />
          <Text style={styles.navLabel}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person-outline" size={24} color="#8E8E93" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  locationLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginRight: 4,
  },
  locationChevron: {
    fontSize: 12,
    color: '#007AFF',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    position: 'relative',
  },
  iconText: {
    fontSize: 24,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  filtersContainer: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewMapText: {
    fontSize: 14,
    color: '#007AFF',
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  matchCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
  },
  matchImageContainer: {
    position: 'relative',
    height: 200,
  },
  matchImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchImageIcon: {
    fontSize: 64,
  },
  matchImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 15,
  },
  matchLocation: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  matchTags: {
    flexDirection: 'row',
    gap: 8,
  },
  matchTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchTagRed: {
    backgroundColor: '#FF3B30',
  },
  matchTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  matchTagTextRed: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  matchDetails: {
    padding: 15,
  },
  matchTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchTimeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  matchTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  matchPlayersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchPlayers: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    marginLeft: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  matchStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 15,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  errorDetail: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8E8E93',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
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
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 10,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navIconActive: {
    color: '#007AFF',
  },
  navLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  navLabelActive: {
    color: '#007AFF',
  },
  navFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  navFabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
