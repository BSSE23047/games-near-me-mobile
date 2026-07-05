import { apiClient } from './api';
import {
  Match,
  RequestMatchRequest,
  ApproveRejectMatchRequest,
} from '../types';

export const matchesService = {
  // Get all public matches
  getPublic: async (): Promise<Match[]> => {
    const response = await apiClient.get<Match[]>('/matches/public');
    return response.data;
  },

  /** Pending match requests for the current user's venues (venue owner dashboard) */
  getPendingForOwner: async (): Promise<Match[]> => {
    const response = await apiClient.get<Match[]>('/matches/pending-for-owner');
    return response.data;
  },

  // Get a match by ID
  getById: async (id: string): Promise<Match> => {
    const response = await apiClient.get<Match>(`/matches/${id}`);
    return response.data;
  },

  // Request a match for a slot
  request: async (data: RequestMatchRequest): Promise<Match> => {
    const response = await apiClient.post<Match>('/matches/request', data);
    return response.data;
  },

  // Approve or reject a match (venue owner only)
  approveReject: async (
    id: string,
    data: ApproveRejectMatchRequest
  ): Promise<Match> => {
    const response = await apiClient.patch<Match>(
      `/matches/${id}/approve-reject`,
      data
    );
    return response.data;
  },

  // Toggle match visibility (host only)
  toggleVisibility: async (id: string): Promise<Match> => {
    const response = await apiClient.patch<Match>(
      `/matches/${id}/toggle-visibility`
    );
    return response.data;
  },
};





