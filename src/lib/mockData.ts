// Mock data store for KAKI BOOK SG
// All data is stored in memory + localStorage for persistence across reloads

export interface MockUser {
  id: string;
  email: string;
  role: 'player' | 'organizer' | 'admin';
  verified: boolean;
  pendingVerification: boolean;
  password: string;
  displayName: string;
  phone?: string;
}

export type PaymentPolicyType = 'immediate' | 'before' | 'after' | 'optional';
export interface PaymentPolicy {
  type: PaymentPolicyType;
  hours?: number; // used for 'before' and 'after'
}

export interface MockEvent {
  id: string;
  userId: string;
  venue: string;
  date: string;
  description: string;
  createdAt: string;
  publicAnnouncements: string[];
  exclusiveReveals: string[];
  courtAssignments: Record<string, string[]>; // e.g. { "Hour 1 (7-8pm)": ["Court 1", "Court 2"] }
  organizerPhone?: string;
  participantVisibility?: 'public' | 'private'; // default: public
  paymentPolicy?: PaymentPolicy; // default: immediate
  collectPhone?: boolean; // default: true
}

export interface GuestBooking {
  id: string;
  guestName: string;
  guestPhone: string;
  timeslotId: string;
  eventId: string;
  status: 'pending' | 'confirmed';
  createdAt: string;
}

export interface MockTimeslot {
  id: string;
  userId: string;
  eventId: string;
  label: string;
  price: number;
  maxCapacity: number;
  currentCapacity: number;
  startTime: string; // 24h format e.g. "1700"
  duration: string; // e.g. "2HR"
}

export interface MockBooking {
  id: string;
  userId: string;
  timeslotId: string;
  status: 'pending' | 'confirmed';
  paymentRef: string;
  amount: number;
  createdAt: string;
}

export interface MockWaitlistEntry {
  id: string;
  userId: string;
  timeslotId: string;
  position: number;
  createdAt: string;
}

export interface MockSpecialRequest {
  id: string;
  userId: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected';
  price: number;
  createdAt: string;
}

export interface MockReview {
  id: string;
  eventId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  reply?: string;
  replyAt?: string;
}

export interface MockGroup {
  id: string;
  organizerId: string; // user who created the group
  name: string;
  description: string;
  sport: string;
  memberIds: string[];
  createdAt: string;
}

// Seed users
const SEED_USERS: MockUser[] = [
  { id: 'user-1', email: 'yjqbenjaminbusiness@gmail.com', role: 'admin', verified: true, pendingVerification: false, password: 'admin123', displayName: 'Admin Benjamin', phone: '+65 9123 4567' },
  { id: 'user-2', email: 'yjqbenjaminbusiness2@gmail.com', role: 'player', verified: true, pendingVerification: false, password: 'player123', displayName: 'Player Ben', phone: '+65 8765 4321' },
  { id: 'user-3', email: 'yjqbenjaminbusiness3@gmail.com', role: 'organizer', verified: true, pendingVerification: false, password: 'organizer123', displayName: 'Michael Jordan', phone: '+65 9123 4567' },
  { id: 'user-4', email: 'yjqbenjaminbusiness4@gmail.com', role: 'organizer', verified: false, pendingVerification: true, password: 'player456', displayName: 'Org Support', phone: '+65 9999 8888' },
];

// Sample events (created by a verified organizer for demo)
const SEED_EVENTS: MockEvent[] = [
  {
    id: 'evt-1',
    userId: 'user-3',
    venue: 'Senja Cashew Sports Hall',
    date: '2026-02-15',
    description: 'Badminton session. Bring your own racquet.',
    createdAt: '2026-02-05T10:00:00Z',
    publicAnnouncements: ['Bring extra shirts/water', 'Meet at lobby 6:45pm'],
    exclusiveReveals: ['Door code: 1234#', 'Parking: Level 2 green'],
    courtAssignments: {
      'Hour 1 (5-6pm)': ['Court 1', 'Court 2'],
      'Hour 2 (6-7pm)': ['Court 3', 'Court 4'],
    },
    organizerPhone: '+65 9123 4567',
  },
  {
    id: 'evt-2',
    userId: 'user-3',
    venue: 'Demo Activity CCAB',
    date: '2026-02-20',
    description: 'Basketball pickup game. All skill levels welcome!',
    createdAt: '2026-02-06T12:00:00Z',
    publicAnnouncements: [],
    exclusiveReveals: [],
    courtAssignments: {},
    organizerPhone: '+65 9123 4567',
  },
];

const SEED_TIMESLOTS: MockTimeslot[] = [
  { id: 'ts-1', userId: 'user-3', eventId: 'evt-1', label: '4hr: 5-9pm', price: 80, maxCapacity: 8, currentCapacity: 0, startTime: '1700', duration: '4HR' },
  { id: 'ts-2', userId: 'user-3', eventId: 'evt-1', label: '3hr: 5-8pm', price: 60, maxCapacity: 6, currentCapacity: 0, startTime: '1700', duration: '3HR' },
  { id: 'ts-3', userId: 'user-3', eventId: 'evt-1', label: '2hr: 5-7pm', price: 40, maxCapacity: 4, currentCapacity: 2, startTime: '1700', duration: '2HR' },
  { id: 'ts-4', userId: 'user-3', eventId: 'evt-1', label: '2hr: 7-9pm', price: 40, maxCapacity: 4, currentCapacity: 1, startTime: '1900', duration: '2HR' },
  { id: 'ts-5', userId: 'user-3', eventId: 'evt-2', label: '3hr: 6-9pm', price: 60, maxCapacity: 10, currentCapacity: 3, startTime: '1800', duration: '3HR' },
  { id: 'ts-6', userId: 'user-3', eventId: 'evt-2', label: '2hr: 6-8pm', price: 40, maxCapacity: 6, currentCapacity: 0, startTime: '1800', duration: '2HR' },
];

const SEED_GROUPS: MockGroup[] = [
  {
    id: 'grp-1',
    organizerId: 'user-3',
    name: 'Weekend Warriors',
    description: 'Casual badminton group for weekend games. All levels welcome!',
    sport: 'Badminton',
    memberIds: ['user-3', 'user-2'],
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'grp-2',
    organizerId: 'user-3',
    name: 'Hoops SG',
    description: 'Pickup basketball sessions. Must be able to run 3v3.',
    sport: 'Basketball',
    memberIds: ['user-3'],
    createdAt: '2026-02-03T10:00:00Z',
  },
];

const SEED_BOOKINGS: MockBooking[] = [
  { id: 'bk-1', userId: 'user-2', timeslotId: 'ts-3', status: 'confirmed', paymentRef: 'SENJA-20260215-1700-2HR-2', amount: 40, createdAt: '2026-02-07T08:00:00Z' },
  { id: 'bk-2', userId: 'user-2', timeslotId: 'ts-3', status: 'confirmed', paymentRef: 'SENJA-20260215-1700-2HR-2', amount: 40, createdAt: '2026-02-07T08:10:00Z' },
  { id: 'bk-3', userId: 'user-2', timeslotId: 'ts-4', status: 'pending', paymentRef: '', amount: 40, createdAt: '2026-02-07T09:00:00Z' },
];

function genId(): string {
  return Math.random().toString(36).substring(2, 12);
}

// --- Store class ---
// Helper: generate QR payment reference
// NEW FORMAT: VENUE4-DDMM-STARTTIME-DURATION-USERCODE4
export function generatePaymentRef(venue: string, date: string, timeslot: MockTimeslot, userId: string): string {
  // Venue: first 4 chars uppercase, no spaces
  const v = venue.replace(/\s+/g, '').substring(0, 4).toUpperCase();

  // Date: DDMM
  const dObj = new Date(date);
  const dd = dObj.getDate().toString().padStart(2, '0');
  const mm = (dObj.getMonth() + 1).toString().padStart(2, '0');
  const d = `${dd}${mm}`;

  // Start time: 24h format from timeslot
  const st = timeslot.startTime || '0000';

  // Duration: from timeslot
  const dur = timeslot.duration || '2HR';

  // User code: first 4 chars of user ID (after "user-" prefix if present)
  const cleanId = userId.replace('user-', '');
  const userCode = cleanId.substring(0, 4).toUpperCase();

  const ref = `${v}-${d}-${st}-${dur}-${userCode}`;
  // Trim to 20 chars
  return ref.substring(0, 20);
}

// Helper: get display name for a user, fallback to email prefix
export function getPlayerDisplayName(user: MockUser | undefined): string {
  if (!user) return 'Unknown';
  if (user.displayName && user.displayName.trim()) return user.displayName;
  // Fallback: email prefix before @
  if (user.email) return user.email.split('@')[0];
  return 'Unknown';
}

class MockStore {
  users: MockUser[];
  events: MockEvent[];
  timeslots: MockTimeslot[];
  bookings: MockBooking[];
  specialRequests: MockSpecialRequest[];
  waitlist: MockWaitlistEntry[];
  reviews: MockReview[];
  groups: MockGroup[];

  constructor() {
    // Try restore from localStorage, fallback to seeds
    const saved = localStorage.getItem('kakibook_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.users = parsed.users || SEED_USERS;
      this.timeslots = parsed.timeslots || SEED_TIMESLOTS;
      this.bookings = parsed.bookings || SEED_BOOKINGS;
      this.specialRequests = parsed.specialRequests || [];
      this.waitlist = parsed.waitlist || [];
      this.reviews = parsed.reviews || [];
      this.groups = parsed.groups || SEED_GROUPS;
      // Normalize events to always have required array fields
      this.events = (parsed.events || SEED_EVENTS).map((e: MockEvent) => ({
        ...e,
        publicAnnouncements: Array.isArray(e.publicAnnouncements) ? e.publicAnnouncements : [],
        exclusiveReveals: Array.isArray(e.exclusiveReveals) ? e.exclusiveReveals : [],
        courtAssignments: (e.courtAssignments && typeof e.courtAssignments === 'object') ? e.courtAssignments : {},
      }));
    } else {
      this.users = [...SEED_USERS];
      this.events = [...SEED_EVENTS];
      this.timeslots = [...SEED_TIMESLOTS];
      this.bookings = [...SEED_BOOKINGS];
      this.specialRequests = [];
      this.waitlist = [];
      this.reviews = [];
      this.groups = [...SEED_GROUPS];
    }
  }

  save() {
    localStorage.setItem('kakibook_data', JSON.stringify({
      users: this.users,
      events: this.events,
      timeslots: this.timeslots,
      bookings: this.bookings,
      specialRequests: this.specialRequests,
      waitlist: this.waitlist,
      reviews: this.reviews,
      groups: this.groups,
    }));
  }

  reset() {
    this.users = [...SEED_USERS];
    this.events = [...SEED_EVENTS];
    this.timeslots = [...SEED_TIMESLOTS];
    this.bookings = [...SEED_BOOKINGS];
    this.specialRequests = [];
    this.waitlist = [];
    this.reviews = [];
    this.groups = [...SEED_GROUPS];
    this.save();
  }

  // --- Groups ---
  createGroup(organizerId: string, name: string, description: string, sport: string): MockGroup {
    const group: MockGroup = {
      id: `grp-${genId()}`,
      organizerId,
      name,
      description,
      sport,
      memberIds: [organizerId],
      createdAt: new Date().toISOString(),
    };
    this.groups.push(group);
    this.save();
    return group;
  }

  getGroup(id: string): MockGroup | undefined {
    return this.groups.find(g => g.id === id);
  }

  listGroupsByOrganizer(organizerId: string): MockGroup[] {
    return this.groups.filter(g => g.organizerId === organizerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listGroupsForMember(userId: string): MockGroup[] {
    return this.groups.filter(g => g.memberIds.includes(userId));
  }

  joinGroup(userId: string, groupId: string): boolean {
    const group = this.getGroup(groupId);
    if (!group) return false;
    if (group.memberIds.includes(userId)) return false;
    group.memberIds.push(userId);
    this.save();
    return true;
  }

  leaveGroup(userId: string, groupId: string): boolean {
    const group = this.getGroup(groupId);
    if (!group) return false;
    if (group.organizerId === userId) return false; // organizer can't leave own group
    group.memberIds = group.memberIds.filter(id => id !== userId);
    this.save();
    return true;
  }

  deleteGroup(groupId: string) {
    this.groups = this.groups.filter(g => g.id !== groupId);
    this.save();
  }

  updateGroup(groupId: string, updates: Partial<Pick<MockGroup, 'name' | 'description' | 'sport'>>) {
    const group = this.getGroup(groupId);
    if (group) {
      Object.assign(group, updates);
      this.save();
    }
  }

  // --- Auth ---
  login(email: string, password: string): MockUser | null {
    const u = this.users.find(u => u.email === email && u.password === password);
    return u || null;
  }

  signupPlayer(email: string, password: string, displayName: string, phone?: string): MockUser {
    const user: MockUser = {
      id: `user-${genId()}`,
      email, password, displayName, phone,
      role: 'player', verified: true, pendingVerification: false,
    };
    this.users.push(user);
    this.save();
    return user;
  }

  signupOrganizer(email: string, password: string, displayName: string, phone?: string): MockUser {
    const user: MockUser = {
      id: `user-${genId()}`,
      email, password, displayName, phone,
      role: 'organizer', verified: false, pendingVerification: true,
    };
    this.users.push(user);
    this.save();
    return user;
  }

  verifyOrganizer(userId: string) {
    const u = this.users.find(u => u.id === userId);
    if (u) { u.verified = true; u.pendingVerification = false; this.save(); }
  }

  rejectOrganizer(userId: string) {
    const u = this.users.find(u => u.id === userId);
    if (u) { u.verified = false; u.pendingVerification = false; this.save(); }
  }

  getPendingOrganizers(): MockUser[] {
    return this.users.filter(u => u.role === 'organizer' && u.pendingVerification);
  }

  getUser(id: string): MockUser | undefined {
    return this.users.find(u => u.id === id);
  }

  // --- Events ---
  createEvent(userId: string, venue: string, date: string, description: string, organizerPhone?: string, participantVisibility: 'public' | 'private' = 'public', paymentPolicy?: PaymentPolicy, collectPhone: boolean = true): MockEvent {
    const evt: MockEvent = {
      id: `evt-${genId()}`, userId, venue, date, description,
      createdAt: new Date().toISOString(),
      publicAnnouncements: [],
      exclusiveReveals: [],
      courtAssignments: {},
      organizerPhone,
      participantVisibility,
      paymentPolicy,
      collectPhone,
    };
    this.events.push(evt);
    this.save();
    return evt;
  }

  updateEventVisibility(id: string, participantVisibility: 'public' | 'private') {
    const evt = this.getEvent(id);
    if (evt) {
      evt.participantVisibility = participantVisibility;
      this.save();
    }
  }

  updateEventAnnouncements(id: string, publicAnnouncements: string[], exclusiveReveals: string[]) {
    const evt = this.getEvent(id);
    if (evt) {
      evt.publicAnnouncements = publicAnnouncements;
      evt.exclusiveReveals = exclusiveReveals;
      this.save();
    }
  }

  updateCourtAssignments(id: string, assignments: Record<string, string[]>) {
    const evt = this.getEvent(id);
    if (evt) {
      evt.courtAssignments = assignments;
      this.save();
    }
  }

  getEvent(id: string): MockEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  listEvents(): MockEvent[] {
    return [...this.events].sort((a, b) => a.date.localeCompare(b.date));
  }

  listEventsByUser(userId: string): MockEvent[] {
    return this.events.filter(e => e.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // --- Timeslots ---
  createTimeslot(userId: string, eventId: string, label: string, price: number, maxCapacity: number, startTime: string, duration: string): MockTimeslot {
    const ts: MockTimeslot = {
      id: `ts-${genId()}`, userId, eventId, label, price, maxCapacity, currentCapacity: 0,
      startTime, duration,
    };
    this.timeslots.push(ts);
    this.save();
    return ts;
  }

  getTimeslot(id: string): MockTimeslot | undefined {
    return this.timeslots.find(t => t.id === id);
  }

  listTimeslotsByEvent(eventId: string): MockTimeslot[] {
    return this.timeslots.filter(t => t.eventId === eventId);
  }

  updateTimeslotCapacity(timeslotId: string, newMaxCapacity: number): { success: boolean; warning?: string } {
    const ts = this.timeslots.find(t => t.id === timeslotId);
    if (!ts) return { success: false };
    if (newMaxCapacity < ts.currentCapacity) {
      return { success: false, warning: `Cannot reduce below ${ts.currentCapacity} — that many players are already registered.` };
    }
    if (newMaxCapacity < 1) return { success: false, warning: 'Minimum 1 slot required.' };
    ts.maxCapacity = newMaxCapacity;
    this.save();
    // Promote waitlist entrants if capacity increased
    const waitlist = this.listWaitlistByTimeslot(timeslotId);
    const available = ts.maxCapacity - ts.currentCapacity;
    const toPromote = waitlist.slice(0, available);
    // Just remove promoted entries from waitlist; in a real system you'd notify them
    toPromote.forEach(w => this.removeFromWaitlist(w.id));
    return { success: true };
  }

  // --- Bookings ---
  createBooking(userId: string, timeslotId: string, amount: number): MockBooking {
    const bk: MockBooking = {
      id: `bk-${genId()}`, userId, timeslotId, status: 'pending',
      paymentRef: '', amount, createdAt: new Date().toISOString(),
    };
    this.bookings.push(bk);
    // Increment capacity
    const ts = this.timeslots.find(t => t.id === timeslotId);
    if (ts) ts.currentCapacity++;
    this.save();
    return bk;
  }

  getBooking(id: string): MockBooking | undefined {
    return this.bookings.find(b => b.id === id);
  }

  confirmBooking(bookingId: string, paymentRef: string) {
    const b = this.bookings.find(bk => bk.id === bookingId);
    if (b) { b.status = 'confirmed'; b.paymentRef = paymentRef; this.save(); }
  }

  rejectBooking(bookingId: string) {
    const idx = this.bookings.findIndex(bk => bk.id === bookingId);
    if (idx === -1) return;
    const booking = this.bookings[idx];
    // Decrement timeslot capacity
    const ts = this.timeslots.find(t => t.id === booking.timeslotId);
    if (ts && ts.currentCapacity > 0) ts.currentCapacity--;
    // Remove the booking entirely so the player can rebook
    this.bookings.splice(idx, 1);
    this.save();
  }

  listBookingsByUser(userId: string): MockBooking[] {
    return this.bookings.filter(b => b.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listBookingsByTimeslot(timeslotId: string): MockBooking[] {
    return this.bookings.filter(b => b.timeslotId === timeslotId);
  }

  // --- Special Requests ---
  createSpecialRequest(userId: string, venue: string, date: string, startTime: string, endTime: string, price: number): MockSpecialRequest {
    const sr: MockSpecialRequest = {
      id: `sr-${genId()}`, userId, venue, date, startTime, endTime, status: 'pending', price,
      createdAt: new Date().toISOString(),
    };
    this.specialRequests.push(sr);
    this.save();
    return sr;
  }

  listSpecialRequests(): MockSpecialRequest[] {
    return [...this.specialRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  approveSpecialRequest(id: string) {
    const sr = this.specialRequests.find(r => r.id === id);
    if (sr) { sr.status = 'approved'; this.save(); }
  }

  rejectSpecialRequest(id: string) {
    const sr = this.specialRequests.find(r => r.id === id);
    if (sr) { sr.status = 'rejected'; this.save(); }
  }

  // --- Waitlist ---
  joinWaitlist(userId: string, timeslotId: string): MockWaitlistEntry | null {
    // Check if already on waitlist
    const existing = this.waitlist.find(w => w.userId === userId && w.timeslotId === timeslotId);
    if (existing) return null;
    // Also check if already booked
    const existingBooking = this.bookings.find(b => b.userId === userId && b.timeslotId === timeslotId);
    if (existingBooking) return null;

    const currentWaitlist = this.listWaitlistByTimeslot(timeslotId);
    const entry: MockWaitlistEntry = {
      id: `wl-${genId()}`,
      userId,
      timeslotId,
      position: currentWaitlist.length + 1,
      createdAt: new Date().toISOString(),
    };
    this.waitlist.push(entry);
    this.save();
    return entry;
  }

  listWaitlistByTimeslot(timeslotId: string): MockWaitlistEntry[] {
    return this.waitlist
      .filter(w => w.timeslotId === timeslotId)
      .sort((a, b) => a.position - b.position);
  }

  removeFromWaitlist(entryId: string) {
    const idx = this.waitlist.findIndex(w => w.id === entryId);
    if (idx !== -1) {
      const entry = this.waitlist[idx];
      this.waitlist.splice(idx, 1);
      // Re-number remaining entries for this timeslot
      const remaining = this.waitlist
        .filter(w => w.timeslotId === entry.timeslotId)
        .sort((a, b) => a.position - b.position);
      remaining.forEach((w, i) => { w.position = i + 1; });
      this.save();
    }
  }

  isOnWaitlist(userId: string, timeslotId: string): boolean {
    return this.waitlist.some(w => w.userId === userId && w.timeslotId === timeslotId);
  }

  // --- Reviews ---
  createReview(userId: string, eventId: string, rating: number, comment: string): MockReview {
    const review: MockReview = {
      id: `rev-${genId()}`,
      userId,
      eventId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    this.reviews.push(review);
    this.save();
    return review;
  }

  replyToReview(reviewId: string, reply: string) {
    const rev = this.reviews.find(r => r.id === reviewId);
    if (rev) {
      rev.reply = reply;
      rev.replyAt = new Date().toISOString();
      this.save();
    }
  }

  listReviewsByEvent(eventId: string): MockReview[] {
    return this.reviews.filter(r => r.eventId === eventId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listReviewsByOrganizer(organizerId: string): MockReview[] {
    const eventIds = this.events.filter(e => e.userId === organizerId).map(e => e.id);
    return this.reviews.filter(r => eventIds.includes(r.eventId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  hasReviewed(userId: string, eventId: string): boolean {
    return this.reviews.some(r => r.userId === userId && r.eventId === eventId);
  }

  getAverageRating(eventId: string): number {
    const eventReviews = this.listReviewsByEvent(eventId);
    if (eventReviews.length === 0) return 0;
    const sum = eventReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / eventReviews.length) * 10) / 10;
  }

  getOrganizerAverageRating(organizerId: string): number {
    const organizerReviews = this.listReviewsByOrganizer(organizerId);
    if (organizerReviews.length === 0) return 0;
    const sum = organizerReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / organizerReviews.length) * 10) / 10;
  }
}

export const store = new MockStore();