import { apiClient } from './api';
import { Venue } from '../types';

export const venuesService = {
  /** List all venues (for players when hosting a match) */
  getAll: async (): Promise<Venue[]> => {
    const response = await apiClient.get<Venue[]>('/venues');
    return response.data;
  },

  /** List venues owned by current user (for venue owners when creating slots) */
  getMine: async (): Promise<Venue[]> => {
    const response = await apiClient.get<Venue[]>('/venues/mine');
    return response.data;
  },

  /** Get a single venue by ID */
  getById: async (id: string): Promise<Venue> => {
    const response = await apiClient.get<Venue>(`/venues/${id}`);
    return response.data;
  },

  /** Create a venue (venue owner only). Pass token to ensure fresh JWT is sent. */
  create: async (
    data: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    },
    accessToken?: string
  ): Promise<Venue> => {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;
    const response = await apiClient.post<Venue>('/venues', data, { headers });
    return response.data;
  },
};
