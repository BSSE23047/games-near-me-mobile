# Games Near Me - Mobile App

React Native mobile app for the Games Near Me platform, built with Expo.

## 🏗️ Tech Stack

- **React Native** with **Expo**
- **TypeScript**
- **Zustand** for state management
- **TanStack Query (React Query)** for API calls
- **Axios** for REST communication
- **Expo Router** for navigation
- **Supabase** for authentication

## 📁 Project Structure

```
games-near-me-mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout with navigation
│   ├── index.tsx          # Initial routing screen
│   ├── login.tsx          # Login/Sign up screen
│   ├── home.tsx           # Home screen with public matches
│   ├── venue/[id].tsx     # Venue detail screen
│   ├── match/[id].tsx     # Match detail screen
│   ├── create-match.tsx   # Create match screen
│   ├── my-matches.tsx     # User's matches
│   └── venue-dashboard.tsx # Venue owner dashboard
├── services/              # API service files
│   ├── api.ts             # Axios setup with auth interceptor
│   ├── slots.ts           # Slot API calls
│   ├── matches.ts         # Match API calls
│   └── participants.ts    # Participant API calls
├── store/                 # Zustand stores
│   └── authStore.ts       # Authentication store
└── types/                 # TypeScript types
    └── index.ts           # Shared types
```

## 🚀 Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create a `.env` file in the root directory:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

3. **Start the development server:**
```bash
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for web

## 📱 Screens

### 1. Login Screen
- Email/password authentication
- Sign up and sign in
- Supabase JWT token management

### 2. Home Screen
- Displays public matches
- Pull-to-refresh
- Navigation to match details
- Role-based dashboard access

### 3. Venue Detail Screen
- Available slots
- Slot states (AVAILABLE, PENDING, LOCKED, etc.)
- Create match from available slot

### 4. Create Match Screen
- Select slot
- Enter match details (title, description, max players)
- Toggle private/public visibility
- Request match creation

### 5. Match Detail Screen
- Match information
- Participants list
- Join match button
- Toggle visibility (host only)
- Participant status

### 6. My Matches Screen
- Matches user created or joined
- Host badge indicator
- Participant status
- Navigation to match details

### 7. Venue Owner Dashboard
- Pending match approvals
- Approve/reject matches
- Venue owner only access

## 🔐 Authentication

- Uses Supabase Auth for email/password authentication
- JWT tokens stored in Zustand store
- Axios interceptor automatically attaches token to requests
- Automatic token refresh handled by Supabase client

## 🔌 API Integration

All API calls are made through service files:
- `services/slots.ts` - Slot operations
- `services/matches.ts` - Match operations
- `services/participants.ts` - Participant operations

Axios instance configured with:
- Base URL from environment variable
- Automatic JWT token attachment
- Error handling for 401 (unauthorized)

## 🎨 UI/UX

- Minimal MVP styling
- Native React Native components
- Loading states for all API calls
- Error handling with user-friendly messages
- Pull-to-refresh on list screens

## 📌 Role-Based Features

- **Player**: Browse matches, join matches, view own matches
- **Host**: Create matches, toggle visibility, approve participants
- **Venue Owner**: Approve/reject matches, view dashboard

## 🛠️ Development

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web

## 📝 Notes

- Backend API URL must be configured in `.env`
- Supabase credentials required for authentication
- All API endpoints match the backend implementation
- TypeScript types match backend Prisma schema





