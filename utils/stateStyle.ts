import { MatchState, ParticipantState } from '../types';

const STATE_COLORS: Record<MatchState | ParticipantState, string> = {
  REQUESTED: '#FF9500',
  APPROVED: '#34C759',
  CHECKED_IN: '#007AFF',
  COMPLETED: '#5856D6',
  REJECTED: '#FF3B30',
  CANCELLED: '#8E8E93',
  LEFT: '#8E8E93',
};

/** Badge colours for a match or participant state, so every screen shows the same colour. */
export function stateBadgeStyle(state: MatchState | ParticipantState) {
  return { backgroundColor: STATE_COLORS[state], color: '#fff' };
}
