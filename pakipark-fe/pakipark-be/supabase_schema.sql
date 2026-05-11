-- 1. Users table (Extending Supabase Auth)
-- Note: Supabase handles auth.users automatically. We can create a public.profiles table.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat FLOAT,
  lng FLOAT,
  total_spots INTEGER DEFAULT 0,
  available_spots INTEGER DEFAULT 0,
  hourly_rate FLOAT DEFAULT 0,
  status TEXT DEFAULT 'active',
  amenities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT,
  plate_number TEXT NOT NULL,
  vehicle_type TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  location_id INTEGER REFERENCES public.locations,
  vehicle_id INTEGER REFERENCES public.vehicles,
  reference TEXT UNIQUE,
  spot TEXT,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming',
  amount FLOAT NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Locations are viewable by everyone" ON public.locations FOR SELECT USING (true);

CREATE POLICY "Users can view their own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
