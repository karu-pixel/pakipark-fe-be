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
  profile_picture: 'pakipark_profile_picture',
  cars: 'pakipark_user_cars',
  payments: 'pakipark_user_payments',
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
    title: 'Find This Guide Again',
    description: "You can replay this tutorial anytime by tapping the help button right here! It's always there when you need it.",
    mascot: mascotGuide,
    targetKey: 'tutorialButton',
  },
];

export const availableLocations: LocationItem[] = [];
export const defaultCars: Vehicle[] = [];
export const initialBookings: Booking[] = [];

export const quickTags = ['Safe Area', 'Easy to Find', 'Friendly Staff', 'Quick Entry', 'Spacious Slot'];
