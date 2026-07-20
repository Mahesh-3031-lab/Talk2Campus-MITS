// MITS Campus Building Data — matches hand-drawn sketch layout

export const CAMPUS_GPS_BOUNDS = {
  minLat: 13.5380,
  maxLat: 13.5420,
  minLon: 78.4960,
  maxLon: 78.5010,
};

export interface Floor {
  level: number;
  name: string;
  rooms: Room[];
}

export interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'lab' | 'office' | 'washroom' | 'stairs' | 'elevator' | 'common' | 'library' | 'cafeteria';
  number?: string;
  capacity?: number;
  department?: string;
}

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
}

export interface Waypoint {
  id: string;
  name: string;
  gridPosition: { x: number; y: number };
  gpsPosition?: GPSCoordinate;
  instruction?: string;
}

export interface Building {
  id: string;
  name: string;
  shortName: string;
  type: 'academic' | 'facility' | 'amenity' | 'hostel' | 'admin' | 'sports' | 'landmark' | 'office';
  description: string;
  location: { x: number; y: number };
  gpsLocation?: GPSCoordinate;
  floors: Floor[];
  timings?: string;
  contact?: string;
  landmarks?: string[];
}

export const campusBuildings: Building[] = [
  // ── Academic / Admin Blocks ──
  {
    id: 'main-block',
    name: 'Main Block',
    shortName: 'Main Block',
    type: 'admin',
    description: 'Central administration block with straight corridor layout. Adjacent to Lakshmi Block.',
    location: { x: 32, y: 38 },
    timings: '8:00 AM - 6:00 PM',
    landmarks: ['Center of campus', 'Near NPN Block', 'Adjacent to Lakshmi Block'],
    floors: [
      {
        level: 0, name: 'Ground Floor',
        rooms: [
          { id: 'mb-g01', name: 'Reception', type: 'office', number: 'G-01' },
          { id: 'mb-g02', name: 'Chairman Office', type: 'office', number: 'G-02' },
          { id: 'mb-g03', name: 'Accounts Section', type: 'office', number: 'G-03' },
          { id: 'mb-g04', name: 'Vice Principal Office', type: 'office', number: 'G-04' },
          { id: 'mb-g05', name: 'Student Welfare Office', type: 'office', number: 'G-05' },
          { id: 'mb-g06', name: 'International Affairs Office', type: 'office', number: 'G-06' },
          { id: 'mb-g07', name: "Men's Restroom", type: 'washroom', number: 'G-07' },
          { id: 'mb-g08', name: 'Stationery Room', type: 'office', number: 'G-08' },
        ],
      },
    ],
  },
  {
    id: 'npn-block',
    name: 'NPN Block',
    shortName: 'NPN Block',
    type: 'academic',
    description: 'Academic block near Main Block',
    location: { x: 32, y: 50 },
    timings: '8:00 AM - 6:00 PM',
    landmarks: ['Below Main Block', 'Near Main Canteen'],
    floors: [],
  },
  {
    id: 'civil-industrial-block',
    name: 'Civil Industrial Block',
    shortName: 'Civil Industrial',
    type: 'academic',
    description: 'Civil Industrial academic block between Main Block and Lakshmi Block',
    location: { x: 40, y: 25 },
    timings: '8:00 AM - 6:00 PM',
    landmarks: ['Above Main Block', 'Near Lakshmi Block'],
    floors: [],
  },
  {
    id: 'lakshmi-block',
    name: 'Lakshmi Block',
    shortName: 'Lakshmi Block',
    type: 'academic',
    description: 'Academic block near Placement Cell',
    location: { x: 52, y: 25 },
    timings: '8:00 AM - 6:00 PM',
    landmarks: ['Near IndusInd Block', 'Near Placement Cell'],
    floors: [],
  },
  {
    id: 'placement-cell',
    name: 'Placement Cell',
    shortName: 'Placement Cell',
    type: 'office',
    description: 'Training & Placement office located behind Lakshmi Block',
    location: { x: 52, y: 18 },
    timings: '9:00 AM - 5:00 PM',
    landmarks: ['Behind Lakshmi Block'],
    floors: [],
  },
  {
    id: 'industrial-block',
    name: 'Industrial Block',
    shortName: 'Industrial Block',
    type: 'academic',
    description: 'Industrial training block near Auditorium',
    location: { x: 52, y: 12 },
    timings: '8:00 AM - 6:00 PM',
    landmarks: ['Above Placement Cell', 'Near Auditorium'],
    floors: [],
  },
  {
    id: 'auditorium',
    name: 'Auditorium',
    shortName: 'Auditorium',
    type: 'facility',
    description: 'College auditorium for events and seminars',
    location: { x: 62, y: 12 },
    landmarks: ['Near Industrial Block', 'Near Saraswathi Block'],
    floors: [],
  },
  {
    id: 'saraswathi-block',
    name: 'Saraswathi Block',
    shortName: 'Saraswathi Block',
    type: 'academic',
    description: 'Academic block in the north-east area',
    location: { x: 78, y: 12 },
    timings: '8:00 AM - 6:00 PM',
    landmarks: ['Near Auditorium', 'Near Circular Block'],
    floors: [],
  },
  {
    id: 'circular-block',
    name: 'Circular Block',
    shortName: 'Circular Block',
    type: 'academic',
    description: 'Circular-shaped academic block',
    location: { x: 72, y: 25 },
    timings: '8:00 AM - 6:00 PM',
    landmarks: ['Near Saraswathi Block', 'Near Central Library'],
    floors: [],
  },
  {
    id: 'central-library',
    name: 'Central Library',
    shortName: 'Library',
    type: 'facility',
    description: 'Central library located between Saraswathi Block and Circular Block',
    location: { x: 75, y: 18 },
    timings: '8:00 AM - 8:00 PM',
    landmarks: ['Between Saraswathi Block and Circular Block'],
    floors: [],
  },
  {
    id: 'west-block',
    name: 'West Block',
    shortName: 'West Block',
    type: 'academic',
    description: 'Academic block on the east side of campus',
    location: { x: 88, y: 25 },
    timings: '8:00 AM - 6:00 PM',
    landmarks: ['Near Circular Block', "Near Ekadant's Cafe"],
    floors: [],
  },
  {
    id: 'kk-block',
    name: 'KK Block',
    shortName: 'KK Block',
    type: 'academic',
    description: 'MCA & MBA department block with 4 floors, lift and staircase access',
    location: { x: 82, y: 38 },
    timings: '8:00 AM - 6:00 PM',
    landmarks: ["Near Ekadant's Cafe", 'Near Circular Block'],
    floors: [
      {
        level: 0, name: 'Ground Floor',
        rooms: [
          { id: 'kk-g-lobby', name: 'Main Entrance Lobby', type: 'common', number: 'G-01' },
          { id: 'kk-g-btech', name: 'B.Tech Classroom Area', type: 'classroom', number: 'G-02' },
          { id: 'kk-g-audi', name: 'Auditorium Entrance', type: 'common', number: 'G-03' },
          { id: 'kk-g-lift', name: 'Lift', type: 'elevator', number: 'G-L' },
          { id: 'kk-g-stairs', name: 'Staircase', type: 'stairs', number: 'G-S' },
        ],
      },
      {
        level: 1, name: 'First Floor',
        rooms: [
          { id: 'kk-1-mca1', name: 'MCA First Year Classroom', type: 'classroom', number: '1-01', department: 'MCA' },
          { id: 'kk-1-lab', name: 'Computer Lab', type: 'lab', number: '1-02', department: 'MCA' },
          { id: 'kk-1-hod', name: 'HOD Office', type: 'office', number: '1-03', department: 'MCA' },
          { id: 'kk-1-lift', name: 'Lift', type: 'elevator', number: '1-L' },
          { id: 'kk-1-stairs', name: 'Staircase', type: 'stairs', number: '1-S' },
        ],
      },
      {
        level: 2, name: 'Second Floor',
        rooms: [
          { id: 'kk-2-mca2', name: 'MCA Second Year Classroom', type: 'classroom', number: '2-01', department: 'MCA' },
          { id: 'kk-2-mba2', name: 'MBA Second Year Classroom', type: 'classroom', number: '2-02', department: 'MBA' },
          { id: 'kk-2-staff', name: 'Staff Room', type: 'office', number: '2-03' },
          { id: 'kk-2-vp', name: 'Vice Principal Office', type: 'office', number: '2-04' },
          { id: 'kk-2-lift', name: 'Lift', type: 'elevator', number: '2-L' },
          { id: 'kk-2-stairs', name: 'Staircase', type: 'stairs', number: '2-S' },
        ],
      },
      {
        level: 3, name: 'Third Floor',
        rooms: [
          { id: 'kk-3-mba1', name: 'MBA First Year Classroom', type: 'classroom', number: '3-01', department: 'MBA' },
          { id: 'kk-3-faculty', name: 'Faculty Rooms', type: 'office', number: '3-02' },
          { id: 'kk-3-lift', name: 'Lift', type: 'elevator', number: '3-L' },
          { id: 'kk-3-stairs', name: 'Staircase', type: 'stairs', number: '3-S' },
        ],
      },
    ],
  },

  // ── Facilities ──
  {
    id: 'ekadants-cafe',
    name: "Ekadant's Cafe",
    shortName: "Ekadant's",
    type: 'amenity',
    description: "Popular campus cafe beside KK Block serving snacks and beverages",
    location: { x: 86, y: 42 },
    timings: '7:00 AM - 9:00 PM',
    landmarks: ['Beside KK Block', 'Near Lickies'],
    floors: [],
  },
  {
    id: 'lickies',
    name: 'Lickies Ice Creams and Cool Drinks',
    shortName: 'Lickies',
    type: 'amenity',
    description: 'Ice cream and cool drinks spot next to Ekadant\'s Cafe near KK Block',
    location: { x: 90, y: 42 },
    timings: '8:00 AM - 9:00 PM',
    landmarks: ["Next to Ekadant's Cafe", 'Near KK Block'],
    floors: [],
  },
  {
    id: 'main-canteen',
    name: 'Main Canteen',
    shortName: 'Main Canteen',
    type: 'amenity',
    description: 'Main campus canteen on the opposite side of the campus road near NPN Block',
    location: { x: 8, y: 38 },
    timings: '7:00 AM - 8:00 PM',
    landmarks: ['Opposite campus road', 'Near NPN Block'],
    floors: [],
  },

  // ── Landmarks ──
  {
    id: 'i-love-mits-park',
    name: 'I Love MITS Park',
    shortName: 'I Love MITS',
    type: 'landmark',
    description: 'Park area on the west side of campus',
    location: { x: 8, y: 50 },
    landmarks: ['Near Main Canteen', 'West side'],
    floors: [],
  },
  {
    id: 'parking-area',
    name: 'Parking Area',
    shortName: 'Parking',
    type: 'facility',
    description: 'College bus parking area near main gate',
    location: { x: 12, y: 82 },
    landmarks: ['Near Main Gate', 'South-west side'],
    floors: [],
  },
  {
    id: 'ground',
    name: 'MITS Ground',
    shortName: 'Ground',
    type: 'sports',
    description: 'Sports ground on the south-east side',
    location: { x: 75, y: 82 },
    timings: '6:00 AM - 7:00 PM',
    landmarks: ['South-east side', 'Near Main Gate road'],
    floors: [],
  },
];

// Building type colors
export const buildingColors: Record<string, string> = {
  academic: 'hsl(217 91% 60%)',
  facility: 'hsl(142 71% 45%)',
  amenity: 'hsl(38 92% 50%)',
  hostel: 'hsl(258 90% 66%)',
  admin: 'hsl(0 84% 60%)',
  sports: 'hsl(172 66% 50%)',
  landmark: 'hsl(280 65% 55%)',
  office: 'hsl(25 95% 53%)',
};

// Room type colors
export const roomTypeColors: Record<string, string> = {
  classroom: 'hsl(217 91% 60%)',
  lab: 'hsl(142 71% 45%)',
  office: 'hsl(38 92% 50%)',
  washroom: 'hsl(200 18% 46%)',
  stairs: 'hsl(0 0% 45%)',
  elevator: 'hsl(0 0% 55%)',
  common: 'hsl(258 90% 66%)',
  library: 'hsl(25 95% 53%)',
  cafeteria: 'hsl(0 84% 60%)',
};

// Search buildings and rooms
export const searchCampus = (query: string): { buildings: Building[]; rooms: { building: Building; floor: Floor; room: Room }[] } => {
  const q = query.toLowerCase();

  const buildings = campusBuildings.filter(b =>
    b.name.toLowerCase().includes(q) ||
    b.shortName.toLowerCase().includes(q) ||
    b.description.toLowerCase().includes(q)
  );

  const rooms: { building: Building; floor: Floor; room: Room }[] = [];

  campusBuildings.forEach(building => {
    building.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        if (
          room.name.toLowerCase().includes(q) ||
          room.number?.toLowerCase().includes(q) ||
          room.department?.toLowerCase().includes(q)
        ) {
          rooms.push({ building, floor, room });
        }
      });
    });
  });

  return { buildings, rooms };
};
