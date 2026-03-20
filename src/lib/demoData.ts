/**
 * STRICTLY ISOLATED DEMO DATA
 * This file contains mock data and logic for the Demo Simulation.
 * It does NOT connect to the real database or real store.
 */

export interface DemoActivity {
  id: string;
  sport: string;
  venue: string;
  date: string;
  time: string;
  slots: number;
  maxSlots: number;
  price: string;
  description: string;
  status: 'past' | 'upcoming' | 'future';
  players: DemoPlayer[];
  waitlist: DemoPlayer[];
  organizer: string;
  groupName?: string;
}

export interface DemoPlayer {
  id: string;
  name: string;
  status: 'paid' | 'pending' | 'waitlist';
  phone?: string;
}

export interface DemoGroup {
  id: string;
  name: string;
  sport: string;
  members: number;
  activitiesCount: number;
  description: string;
}

export const DEMO_ACTIVITIES: DemoActivity[] = [
  {
    id: 'demo-1',
    sport: 'Badminton',
    venue: 'Jurong East',
    date: '2025-12-10',
    time: '7–9pm',
    slots: 6,
    maxSlots: 8,
    price: '$8',
    description: 'Casual badminton session at Jurong East Sports Hall. All levels welcome!',
    status: 'past',
    organizer: 'Alex Organizer',
    groupName: 'Jurong Badminton Club',
    players: [
      { id: 'p1', name: 'Alex', status: 'paid' },
      { id: 'p2', name: 'Ben', status: 'pending' },
      { id: 'p3', name: 'Chris', status: 'paid' },
      { id: 'p4', name: 'Diana', status: 'paid' },
      { id: 'p5', name: 'Elena', status: 'paid' },
      { id: 'p6', name: 'Frank', status: 'paid' },
    ],
    waitlist: []
  },
  {
    id: 'demo-2',
    sport: 'Football',
    venue: 'Bishan',
    date: '2026-01-05',
    time: '5–7pm',
    slots: 12,
    maxSlots: 14,
    price: '$10',
    description: 'Friendly 7v7 football match at Bishan ActiveSG Pitch.',
    status: 'past',
    organizer: 'Sam Soccer',
    groupName: 'Weekend Football Group',
    players: [
      { id: 'p7', name: 'George', status: 'paid' },
      { id: 'p8', name: 'Harry', status: 'paid' },
      { id: 'p9', name: 'Ivan', status: 'paid' },
      { id: 'p10', name: 'Jack', status: 'paid' },
      { id: 'p11', name: 'Kevin', status: 'paid' },
      { id: 'p12', name: 'Liam', status: 'paid' },
      { id: 'p13', name: 'Mike', status: 'paid' },
      { id: 'p14', name: 'Noah', status: 'paid' },
      { id: 'p15', name: 'Oliver', status: 'paid' },
      { id: 'p16', name: 'Peter', status: 'paid' },
      { id: 'p17', name: 'Quinn', status: 'paid' },
      { id: 'p18', name: 'Ryan', status: 'paid' },
    ],
    waitlist: []
  },
  {
    id: 'demo-3',
    sport: 'Basketball',
    venue: 'Tampines',
    date: '2026-03-25',
    time: '6–8pm',
    slots: 8,
    maxSlots: 8,
    price: '$5',
    description: 'Full court basketball game. Bring your own water!',
    status: 'upcoming',
    organizer: 'Sam Soccer',
    groupName: 'Social Sports SG',
    players: [
      { id: 'p19', name: 'Alex', status: 'paid' },
      { id: 'p20', name: 'Ben', status: 'pending' },
      { id: 'p21', name: 'Chris', status: 'paid' },
      { id: 'p22', name: 'Daniel', status: 'paid' },
      { id: 'p23', name: 'Elena', status: 'paid' },
      { id: 'p24', name: 'Frank', status: 'paid' },
      { id: 'p25', name: 'George', status: 'paid' },
      { id: 'p26', name: 'Harry', status: 'paid' },
    ],
    waitlist: [
      { id: 'p27', name: 'Ethan', status: 'waitlist' },
      { id: 'p28', name: 'Farah', status: 'waitlist' },
    ]
  },
  {
    id: 'demo-4',
    sport: 'Tennis',
    venue: 'Orchard',
    date: '2026-04-02',
    time: '8–10am',
    slots: 2,
    maxSlots: 4,
    price: '$15',
    description: 'Morning tennis session. Intermediate level preferred.',
    status: 'upcoming',
    organizer: 'Tennis Tim',
    players: [
      { id: 'p29', name: 'Ian', status: 'paid' },
      { id: 'p30', name: 'James', status: 'pending' },
    ],
    waitlist: []
  },
  {
    id: 'demo-5',
    sport: 'Volleyball',
    venue: 'Sentosa',
    date: '2030-08-15',
    time: '4–7pm',
    slots: 4,
    maxSlots: 12,
    price: 'Free',
    description: 'Beach volleyball at Siloso Beach. Future Olympics practice!',
    status: 'future',
    organizer: 'Volley Victor',
    groupName: 'Social Sports SG',
    players: [
      { id: 'p31', name: 'Kelly', status: 'paid' },
      { id: 'p32', name: 'Leo', status: 'paid' },
      { id: 'p33', name: 'Mona', status: 'paid' },
      { id: 'p34', name: 'Nick', status: 'paid' },
    ],
    waitlist: []
  }
];

export const DEMO_GROUPS: DemoGroup[] = [
  {
    id: 'g-1',
    name: 'Jurong Badminton Club',
    sport: 'Badminton',
    members: 156,
    activitiesCount: 42,
    description: 'Active badminton community in the West. Weekly sessions at Jurong East and West CC.'
  },
  {
    id: 'g-2',
    name: 'Weekend Football Group',
    sport: 'Football',
    members: 89,
    activitiesCount: 28,
    description: 'Casual Sunday football. All skill levels and ages are welcome!'
  },
  {
    id: 'g-3',
    name: 'Social Sports SG',
    sport: 'Multi-sport',
    members: 320,
    activitiesCount: 115,
    description: 'A community for people who love playing different sports and making new friends.'
  }
];

// Local state simulation
export const getDemoActivities = () => [...DEMO_ACTIVITIES];
export const getDemoGroups = () => [...DEMO_GROUPS];