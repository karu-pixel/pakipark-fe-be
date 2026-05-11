# 🅿️ PakiPark — Smart Parking Reservation System

Welcome to the **PakiPark** project. This system is a full-stack solution for parking reservations, featuring a React Native (Expo) mobile application and a Node.js (Express) backend, all integrated with **Supabase** for Auth, Database, and Storage.

---

## 🏗️ System Architecture

*   **Frontend**: React Native / Expo (Mobile Client)
*   **Backend**: Node.js / Express (Business Logic & API)
*   **Database**: PostgreSQL (via Supabase)
*   **Auth**: Supabase Auth (JWT based)
*   **Storage**: Supabase Storage (for avatars and vehicle documents)

---

## 🚀 Getting Started

### 1. Supabase Setup (Database & Storage)

Before running the apps, you must configure your Supabase project:

1.  **Database Schema**:
    *   Open the [SQL Editor](https://supabase.com/dashboard/project/_/sql) in Supabase.
    *   Copy the contents of `pakipark-be/database/schema.sql` and run it.
2.  **Auth Trigger**:
    *   Run the following SQL to ensure user profiles are automatically created on signup:
    ```sql
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, full_name, role)
      VALUES (new.id, new.raw_user_meta_data->>'full_name', 'customer');
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    ```
3.  **Storage Buckets**:
    *   Go to **Storage** and create two buckets:
        *   `avatars` (Set to **Public**)
        *   `vehicles` (Set to **Public**)

### 2. Backend Configuration

1.  Navigate to `pakipark-be/`.
2.  Install dependencies: `npm install`.
3.  Configure `.env` (I have already created this for you):
    *   Ensure `DATABASE_URL` has your correct password.
    *   Ensure `SUPABASE_SERVICE_ROLE_KEY` is present.
4.  Start the server: `npm run dev`.
    *   The server runs on `http://localhost:5000`.

### 3. Frontend Configuration

1.  Navigate to `pakipark-fe/`.
2.  Install dependencies: `npm install`.
3.  Configure `.env` (I have already created this for you):
    *   Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
4.  Start Expo: `npx expo start`.

---

## 🛠️ How it Works

### Authentication Flow
1.  **Sign Up**: The mobile app calls `supabase.auth.signUp`. Supabase creates the user and our SQL trigger creates a row in the `profiles` table.
2.  **Login**: The app calls `supabase.auth.signInWithPassword`. On success, Supabase returns a **JWT (token)**.
3.  **Authorized Requests**: The mobile app sends this JWT in the `Authorization: Bearer <token>` header to our Backend.
4.  **Backend Validation**: The Backend Auth Middleware uses the Supabase SDK to verify the token and identify the user.

### Data Management
*   **Vehicles & Bookings**: The mobile app reads/writes directly to Supabase for simple data, while the Backend handles complex logic like forfeiture scheduling and slot assignment.
*   **File Uploads**: When you upload an OR/CR or Profile Picture, the Backend receives the file, uploads it to **Supabase Storage**, and saves the public URL in the database.

---

## 📝 Maintenance
*   **Schema Changes**: If you update the SQL schema, remember to update the corresponding Sequelize models in `pakipark-be/models`.
*   **Storage Policies**: If you want to make car documents private, update the RLS policies in the Supabase Storage dashboard.

---

**Developed with ❤️ for PakiPark.**
