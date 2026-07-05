// User and Auth Types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'PLAYER' | 'HOST' | 'VENUE_OWNER' | 'ADMIN';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// Venue Types
export interface Venue {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// Slot Types
export type SlotState = 'AVAILABLE' | 'PENDING' | 'LOCKED' | 'COMPLETED' | 'CANCELLED';

export interface Slot {
  id: string;
  venueId: string;
  startTime: string;
  endTime: string;
  state: SlotState;
  createdAt: string;
  updatedAt: string;
  venue?: Venue;
  match?: Match;
}

// Match Types
export type MatchState = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type MatchVisibility = 'PRIVATE' | 'PUBLIC';

export interface Match {
  id: string;
  slotId: string;
  hostId: string;
  title: string;
  description?: string;
  maxPlayers: number;
  state: MatchState;
  visibility: MatchVisibility;
  createdAt: string;
  updatedAt: string;
  slot?: Slot;
  host?: User;
  participants?: MatchParticipant[];
}

// Participant Types
export type ParticipantState = 'REQUESTED' | 'APPROVED' | 'CHECKED_IN' | 'REJECTED' | 'LEFT';

export interface MatchParticipant {
  id: string;
  matchId: string;
  playerId: string;
  state: ParticipantState;
  createdAt: string;
  updatedAt: string;
  player?: User;
  match?: Match;
}

// API Request/Response Types
export interface CreateSlotRequest {
  venueId: string;
  startTime: string;
  endTime: string;
}

export interface RequestMatchRequest {
  slotId: string;
  title: string;
  description?: string;
  maxPlayers: number;
}

export interface ApproveRejectMatchRequest {
  state: 'APPROVED' | 'REJECTED';
}

export interface JoinMatchRequest {
  matchId: string;
}

export interface ApproveRejectParticipantRequest {
  state: 'APPROVED' | 'REJECTED';
}





