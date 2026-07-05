import { apiClient } from './api';
import { Slot, CreateSlotRequest } from '../types';

export const slotsService = {
  // Get all slots for a venue
  getByVenue: async (venueId: string): Promise<Slot[]> => {
    const response = await apiClient.get<Slot[]>(`/slots/venue/${venueId}`);
    return response.data;
  },

  // Get a single slot by ID
  getById: async (id: string): Promise<Slot> => {
    const response = await apiClient.get<Slot>(`/slots/${id}`);
    return response.data;
  },

  // Create a new slot (venue owner only)
  create: async (data: CreateSlotRequest): Promise<Slot> => {
    const response = await apiClient.post<Slot>('/slots', data);
    return response.data;
  },
};





