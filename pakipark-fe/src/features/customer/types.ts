export type AppTab = 'home' | 'bookings';
export type BookingStatus = 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled' | 'payment_pending' | 'no_show';
export type NotificationType = 'info' | 'confirmed' | 'completed' | 'cancelled' | 'failed';
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'motorcycle';
export type SettingsPage = 'payment-methods' | 'security' | 'notifications' | 'preferences' | null;
export type TutorialTargetKey = 'none' | 'header' | 'reserve' | 'reserveCta' | 'bookings' | 'review' | 'vehicles' | 'guide' | 'tutorialButton' | 'settings';

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
  id?: string;
  _id?: string;
  user_id?: string | number;
  brand: string;
  model: string;
  color: string;
  plate_number: string;
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
  status: 'upcoming' | 'active' | 'completed' | 'cancelled' | 'payment_pending' | 'no_show';
  type: 'Fixed' | 'Flexible';
  price: string;
  amount: number;
  /** String FK to locations table (UUID) — used when submitting a review */
  location_id?: string;
  payment?: string;
  locationName?: string;
  locationAddress?: string;
  vehiclePlateNumber?: string;
  vehicleType?: string;
  startTime?: string;
  endTime?: string;
  totalAmount?: number;
  slotLabel?: string;
  userName?: string;
  userId?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  customerName?: string;
};

export type LocationItem = {
  id: string;
  _id?: string;
  name: string;
  address: string;
  distance: string;
};

export type VehicleDocFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

export type VehicleFormData = {
  brand: string;
  model: string;
  color: string;
  plate_number: string;
  type: VehicleType;
  /** Stored public URL returned from the backend after upload */
  orDoc: string | null;
  crDoc: string | null;
  /** Locally picked file — sent to backend via FormData */
  orDocFile: VehicleDocFile | null;
  crDocFile: VehicleDocFile | null;
};
