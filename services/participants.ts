import { apiClient } from './api';
import {
  MatchParticipant,
  JoinMatchRequest,
  ApproveRejectParticipantRequest,
} from '../types';

export const participantsService = {
  // Join a match (request to participate)
  join: async (data: JoinMatchRequest): Promise<MatchParticipant> => {
    const response = await apiClient.post<MatchParticipant>(
      '/match-participants/join',
      data
    );
    return response.data;
  },

  // Get all participants for a match
  getByMatch: async (matchId: string): Promise<MatchParticipant[]> => {
    const response = await apiClient.get<MatchParticipant[]>(
      `/match-participants/match/${matchId}`
    );
    return response.data;
  },

  // Get a participant by ID
  getById: async (id: string): Promise<MatchParticipant> => {
    const response = await apiClient.get<MatchParticipant>(
      `/match-participants/${id}`
    );
    return response.data;
  },

  // Approve or reject a participant (host only)
  approveReject: async (
    id: string,
    data: ApproveRejectParticipantRequest
  ): Promise<MatchParticipant> => {
    const response = await apiClient.patch<MatchParticipant>(
      `/match-participants/${id}/approve-reject`,
      data
    );
    return response.data;
  },
};





