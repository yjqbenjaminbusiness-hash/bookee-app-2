// Data service - mock implementation (will be replaced with Supabase later)
import { store, type MockEvent, type MockTimeslot, type MockGroup } from './mockData';

export interface Event {
  id: string;
  userId: string;
  venue: string;
  date: string;
  description: string;
  createdAt: string;
  sport?: string;
  location?: string;
}

export interface Timeslot {
  id: string;
  userId: string;
  eventId: string;
  label: string;
  price: number;
  maxCapacity: number;
  currentCapacity: number;
}

export interface Group {
  id: string;
  organizerId: string;
  name: string;
  description: string;
  sport: string;
  createdAt: string;
}

export const dataService = {
  async listEvents(): Promise<Event[]> {
    return store.events as unknown as Event[];
  },

  async getEvent(id: string): Promise<Event> {
    const event = store.events.find(e => e.id === id);
    return event as unknown as Event;
  },

  async listTimeslots(eventId: string): Promise<Timeslot[]> {
    return store.timeslots.filter(t => t.eventId === eventId) as unknown as Timeslot[];
  },

  async createBooking(booking: {
    userId: string;
    timeslotId: string;
    amount: number;
    status: string;
  }) {
    return store.createBooking(booking.userId, booking.timeslotId, booking.amount, '');
  },

  async listGroups(): Promise<Group[]> {
    return store.groups as unknown as Group[];
  },

  async getGroup(id: string): Promise<Group> {
    const group = store.groups.find(g => g.id === id);
    return group as unknown as Group;
  },

  async joinGroup(userId: string, groupId: string) {
    return store.joinGroup(userId, groupId);
  },

  async listGroupsForUser(userId: string): Promise<Group[]> {
    return store.groups.filter(g => g.memberIds.includes(userId)) as unknown as Group[];
  },

  async listUpcomingActivitiesForGroups(groupIds: string[]): Promise<Event[]> {
    const organizerIds = store.groups
      .filter(g => groupIds.includes(g.id))
      .map(g => g.organizerId);
    const today = new Date().toISOString().split('T')[0];
    return store.events
      .filter(e => organizerIds.includes(e.userId) && e.date >= today) as unknown as Event[];
  },
};
