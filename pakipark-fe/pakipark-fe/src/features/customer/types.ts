export type AppTab = 'home' | 'bookings' | 'settings';
export type BookingStatus = 'all' | 'active' | 'completed' | 'cancelled';
export type NotificationType = 'confirmed' | 'completed' | 'cancelled';
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'motorcycle';
export type SettingsPage = 'payment-methods' | 'security' | 'notifications' | 'preferences' | null;
export type TutorialTargetKey = 'none' | 'header' | 'reserve' | 'reserveCta' | 'bookings' | 'review' | 'vehicles' | 'settings' | 'guide' | 'tutorialButton';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
};

export type TutorialStep = {
  title: string;
  description: string;
  mascot: string;
  targetKey?: TutorialTargetKey;
};

export type Vehicle = {
  brand: string;
  model: string;
  color: string;
  plateNumber: string;
  type: VehicleType;
  orDoc: string | null;
  crDoc: string | null;
};

export type Booking = {
  id: string;
  reference: string;
  location: string;
  address: string;
  spot: string;
  date: string;
  time: string;
  vehicle: string;
  status: 'active' | 'completed' | 'cancelled';
  type: 'Fixed' | 'Flexible';
  price: string;
  amount: number;
};

export type LocationItem = {
  id: number;
  name: string;
  address: string;
  distance: string;
};

export type VehicleFormData = {
  brand: string;
  model: string;
  color: string;
  plateNumber: string;
  type: VehicleType;
  orDoc: string | null;
  crDoc: string | null;
};
