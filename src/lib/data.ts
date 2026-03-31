// Data service – Supabase implementation
import { supabase } from '@/integrations/supabase/client';

export interface Activity {
  id: string;
  organizer_id: string;
  title: string;
  sport: string;
  venue: string;
  location: string | null;
  date: string;
  description: string | null;
  status: string;
  group_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivitySession {
  id: string;
  activity_id: string;
  time_label: string;
  start_time: string | null;
  end_time: string | null;
  max_slots: number;
  filled_slots: number;
  price: number;
  created_at: string;
}

export interface Group {
  id: string;
  organizer_id: string;
  name: string;
  description: string;
  sport: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface Ballot {
  id: string;
  activity_name: string;
  sport: string;
  location: string;
  ballot_deadline: string;
  slots: number;
  created_by: string;
  group_id: string | null;
  created_at: string;
}

export const dataService = {
  // ─── Activities ──────────────────────────────────────────────
  async listActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: false });
    if (error) { console.error('listActivities error:', error); return []; }
    return (data || []) as Activity[];
  },

  async listActivitiesByOrganizer(organizerId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('date', { ascending: false });
    if (error) { console.error('listActivitiesByOrganizer error:', error); return []; }
    return (data || []) as Activity[];
  },

  async listActivitiesByGroup(groupId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: false });
    if (error) { console.error('listActivitiesByGroup error:', error); return []; }
    return (data || []) as Activity[];
  },

  async getActivity(id: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) { console.error('getActivity error:', error); return null; }
    return data as Activity | null;
  },

  async createActivity(activity: {
    organizer_id: string;
    title: string;
    sport: string;
    venue: string;
    location?: string;
    date: string;
    description?: string;
    group_id?: string;
    image_url?: string;
  }): Promise<Activity | null> {
    console.log('[dataService] Creating activity:', activity);
    const { data, error } = await supabase
      .from('activities')
      .insert({
        organizer_id: activity.organizer_id,
        title: activity.title,
        sport: activity.sport,
        venue: activity.venue,
        location: activity.location || null,
        date: activity.date,
        description: activity.description || null,
        group_id: activity.group_id || null,
        image_url: activity.image_url || null,
      })
      .select()
      .single();
    if (error) {
      console.error('[dataService] createActivity error:', error);
      throw new Error(error.message);
    }
    console.log('[dataService] Activity created:', data);
    return data as Activity;
  },

  // ─── Activity Sessions ──────────────────────────────────────
  async listSessionsByActivity(activityId: string): Promise<ActivitySession[]> {
    const { data, error } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('activity_id', activityId);
    if (error) { console.error('listSessionsByActivity error:', error); return []; }
    return (data || []) as ActivitySession[];
  },

  async createSession(session: {
    activity_id: string;
    time_label: string;
    start_time?: string;
    end_time?: string;
    max_slots: number;
    price: number;
  }): Promise<ActivitySession | null> {
    const { data, error } = await supabase
      .from('activity_sessions')
      .insert({
        activity_id: session.activity_id,
        time_label: session.time_label,
        start_time: session.start_time || null,
        end_time: session.end_time || null,
        max_slots: session.max_slots,
        price: session.price,
      })
      .select()
      .single();
    if (error) {
      console.error('[dataService] createSession error:', error);
      throw new Error(error.message);
    }
    return data as ActivitySession;
  },

  // ─── Groups ─────────────────────────────────────────────────
  async listGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('listGroups error:', error); return []; }
    // Get member counts
    const groups = (data || []) as Group[];
    if (groups.length > 0) {
      const { data: members } = await supabase
        .from('group_members')
        .select('group_id');
      if (members) {
        const counts: Record<string, number> = {};
        members.forEach(m => { counts[m.group_id] = (counts[m.group_id] || 0) + 1; });
        groups.forEach(g => { g.member_count = counts[g.id] || 0; });
      }
    }
    return groups;
  },

  async listGroupsByOrganizer(organizerId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });
    if (error) { console.error('listGroupsByOrganizer error:', error); return []; }
    return (data || []) as Group[];
  },

  async listGroupsForUser(userId: string): Promise<Group[]> {
    const { data: memberRows, error: mErr } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
    if (mErr || !memberRows?.length) return [];
    const groupIds = memberRows.map(m => m.group_id);
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);
    if (error) { console.error('listGroupsForUser error:', error); return []; }
    return (data || []) as Group[];
  },

  async getGroup(id: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) { console.error('getGroup error:', error); return null; }
    if (data) {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', id);
      (data as Group).member_count = count || 0;
    }
    return data as Group | null;
  },

  async createGroup(group: {
    organizer_id: string;
    name: string;
    description?: string;
    sport?: string;
  }): Promise<Group | null> {
    console.log('[dataService] Creating group:', group);
    const { data, error } = await supabase
      .from('groups')
      .insert({
        organizer_id: group.organizer_id,
        name: group.name,
        description: group.description || '',
        sport: group.sport || 'Other',
      })
      .select()
      .single();
    if (error) {
      console.error('[dataService] createGroup error:', error);
      throw new Error(error.message);
    }
    // Auto-join organizer as member
    await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: group.organizer_id,
    });
    return data as Group;
  },

  async deleteGroup(id: string): Promise<void> {
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async updateGroup(id: string, updates: { name?: string; description?: string; sport?: string; image_url?: string }): Promise<void> {
    const { error } = await supabase.from('groups').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async joinGroup(userId: string, groupId: string): Promise<void> {
    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
    });
    if (error && !error.message.includes('duplicate')) throw new Error(error.message);
  },

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  async getGroupMembers(groupId: string): Promise<Array<{ user_id: string; joined_at: string }>> {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id, joined_at')
      .eq('group_id', groupId);
    if (error) { console.error('getGroupMembers error:', error); return []; }
    return data || [];
  },

  async isGroupMember(userId: string, groupId: string): Promise<boolean> {
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('user_id', userId);
    return (count || 0) > 0;
  },

  // ─── Ballots ────────────────────────────────────────────────
  async listBallots(): Promise<Ballot[]> {
    const { data, error } = await supabase
      .from('ballots')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('listBallots error:', error); return []; }
    return (data || []) as Ballot[];
  },

  async listBallotsByGroup(groupId: string): Promise<Ballot[]> {
    const { data, error } = await supabase
      .from('ballots')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) { console.error('listBallotsByGroup error:', error); return []; }
    return (data || []) as Ballot[];
  },

  // ─── Bookings ───────────────────────────────────────────────
  async listBookingsByUser(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, activity_sessions(*, activities(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error('listBookingsByUser error:', error); return []; }
    return data || [];
  },

  // ─── Image Upload ───────────────────────────────────────────
  async uploadActivityImage(file: File, activityId: string): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `${activityId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('activity-images')
      .upload(path, file);
    if (error) {
      console.error('[dataService] uploadActivityImage error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('activity-images')
      .getPublicUrl(path);
    return urlData.publicUrl;
  },

  async uploadGroupImage(file: File, groupId: string): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `${groupId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('group-images')
      .upload(path, file);
    if (error) {
      console.error('[dataService] uploadGroupImage error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('group-images')
      .getPublicUrl(path);
    return urlData.publicUrl;
  },

  // ─── Demo Data ──────────────────────────────────────────────
  getDemoActivity(): Activity {
    return {
      id: 'demo-activity-001',
      organizer_id: 'demo-user',
      title: 'Demo Activity – Weekend Badminton',
      sport: 'Badminton',
      venue: 'Demo Sports Hall',
      location: 'Demo Location',
      date: '2033-12-31',
      description: 'This is a demo activity to showcase the platform. Not a real session.',
      status: 'active',
      group_id: 'demo-group-001',
      image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  getDemoGroup(): Group {
    return {
      id: 'demo-group-001',
      organizer_id: 'demo-user',
      name: 'Demo Group – Badminton Club',
      description: 'This is a demo group to showcase the platform features.',
      sport: 'Badminton',
      image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 25,
    };
  },
};
