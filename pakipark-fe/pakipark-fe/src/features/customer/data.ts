import type { Booking, LocationItem, TutorialStep, Vehicle } from '@features/customer/types';

export const COLORS = {
  background: '#F4F6F9',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1E3D5A',
  muted: '#6B7280',
  subtle: '#9CA3AF',
  primary: '#EE6B20',
  primaryDark: '#D55F1C',
  navy: '#1E3D5A',
  success: '#16A34A',
  danger: '#EF4444',
} as const;

export const STORAGE_KEYS = {
  tutorial: 'pakipark_has_seen_tutorial',
  notifications: 'pakipark_notifications',
  profileName: 'pakipark_profile_name',
  profilePicture: 'pakipark_profile_picture',
  cars: 'pakipark_user_cars',
} as const;

export const mascotWelcome = 'https://imgur.com/eX4KbNU.png';
export const mascotVehicle = 'https://i.imgur.com/Ii3MgyD.png';
export const mascotReserve = 'https://i.imgur.com/bZ7u7r7.png';
export const mascotBookings = 'https://i.imgur.com/gvf0rH5.png';
export const mascotReview = 'https://i.imgur.com/ko6T5Fw.png';
export const mascotSettings = 'https://i.imgur.com/AKpivID.png';
export const mascotGuide = 'https://i.imgur.com/bZ7u7r7.png';
export const mascotParkNow = 'https://i.imgur.com/2WJFHah.png';
export const mascotMyBookings = 'https://i.imgur.com/bLdEf8v.png';
export const mascotRateReview = 'https://i.imgur.com/eOXj63A.png';

export const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to PakiPark',
    description: "Hi there! I'm your guide. Let me walk you through everything you need to know to park with ease.",
    mascot: mascotWelcome,
    targetKey: 'none',
  },
  {
    title: 'Manage Your Vehicles',
    description: "This is your Vehicle Management section. See all your registered cars here, tap one to set it as active, hit 'Add New' to register a vehicle, or use the edit and delete options to keep your list up to date.",
    mascot: mascotVehicle,
    targetKey: 'vehicles',
  },
  {
    title: 'Reserve a Parking Spot',
    description: "Ready to park? Tap 'Reserve a Spot Now' to search for nearby parking locations and book your slot in seconds.",
    mascot: mascotReserve,
    targetKey: 'reserveCta',
  },
  {
    title: 'View Your Bookings',
    description: "Tap 'Bookings' in the quick actions or bottom nav to see your current and past parking reservations anytime.",
    mascot: mascotBookings,
    targetKey: 'bookings',
  },
  {
    title: 'Rate & Review',
    description: "Had a great experience? Let us know! Tap 'Reviews' to rate your parking spot and share feedback with others.",
    mascot: mascotReview,
    targetKey: 'review',
  },
  {
    title: 'Settings',
    description: 'Tap the Settings tab here in the bottom nav to manage your account preferences, notifications, and privacy options - all in one place.',
    mascot: mascotSettings,
    targetKey: 'settings',
  },
  {
    title: 'Find This Guide Again',
    description: "You can replay this tutorial anytime by tapping the help button right here - the one that's glowing! It's always there when you need it.",
    mascot: mascotGuide,
    targetKey: 'tutorialButton',
  },
];

export const availableLocations: LocationItem[] = [
  { id: 1, name: 'Ayala Center', address: 'Makati Central Business District', distance: '3.5 km away' },
  { id: 2, name: 'Robinsons Galleria', address: 'EDSA cor. Ortigas Avenue, Quezon City', distance: '5.0 km away' },
  { id: 3, name: 'SM North EDSA', address: 'North Avenue cor. EDSA, Quezon City', distance: '6.8 km away' },
  { id: 4, name: 'SM San Lazaro', address: 'Felix Huertas cor. A.H. Lacson St., Manila', distance: '8.4 km away' },
  { id: 5, name: 'SM Mall of Asia', address: 'Seaside Blvd, Pasay City', distance: '11.5 km away' },
];

export const defaultCars: Vehicle[] = [
  { brand: 'Toyota', model: 'Vios', color: 'Silver', plateNumber: 'ABC 1234', type: 'sedan', orDoc: null, crDoc: null },
  { brand: 'Honda', model: 'Civic', color: 'Black', plateNumber: 'XYZ 7890', type: 'sedan', orDoc: null, crDoc: null },
];

export const initialBookings: Booking[] = [
  {
    id: '1',
    reference: 'PKP-00001234',
    location: 'Ayala Center',
    address: 'Makati Central Business District',
    spot: 'A-12',
    date: 'March 15, 2026',
    time: '10:00 AM - 2:00 PM',
    vehicle: 'Toyota Vios (ABC 1234)',
    status: 'active',
    type: 'Fixed',
    price: 'P200',
    amount: 200,
  },
  {
    id: '2',
    reference: 'PKP-00001235',
    location: 'SM North EDSA',
    address: 'North Avenue cor. EDSA, Quezon City',
    spot: 'B-05',
    date: 'March 12, 2026',
    time: '3:00 PM - 6:00 PM',
    vehicle: 'Honda Civic (XYZ 7890)',
    status: 'completed',
    type: 'Flexible',
    price: 'P150',
    amount: 150,
  },
  {
    id: '3',
    reference: 'PKP-00001236',
    location: 'Robinsons Galleria',
    address: 'EDSA cor. Ortigas Avenue',
    spot: 'C-23',
    date: 'March 10, 2026',
    time: '1:00 PM - 5:00 PM',
    vehicle: 'Toyota Vios (ABC 1234)',
    status: 'completed',
    type: 'Fixed',
    price: 'P180',
    amount: 180,
  },
];

export const recentBookings = [
  { loc: 'SM City Mall', date: 'Oct 24, 2023 • 02:30 PM', price: '150' },
  { loc: 'Ayala Center', date: 'Oct 22, 2023 • 10:15 AM', price: '200' },
];

export const quickTags = ['Safe Area', 'Easy to Find', 'Friendly Staff', 'Quick Entry', 'Spacious Slot'];
