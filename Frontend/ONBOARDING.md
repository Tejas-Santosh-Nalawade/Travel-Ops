# Onboarding Screens

This project includes 4 onboarding screens converted from HTML to React Native with TypeScript and NativeWind (Tailwind CSS for React Native).

## Screens Overview

### 1. **Onboarding1Welcome** (`/onboarding1`)
- Welcome screen with hero image
- App branding "MotherCare"
- Navigation: Skip button → Next button to Onboarding2

### 2. **Onboarding2Language** (`/onboarding2`)
- Language selection screen
- Grid layout with 4 languages: English, Hindi, Bengali, Telugu
- Selected language has a checkmark and primary border
- Navigation: Back button → Next button to Onboarding3

### 3. **Onboarding3Features** (`/onboarding3`)
- Features overview screen
- Lists 3 key features:
  - Hospital Tracking
  - Emergency One-Tap
  - Offline Sync
- Navigation: Back button → "Get Started" button to Onboarding4

### 4. **Onboarding4Role** (`/onboarding4`)
- Role selection screen
- Two options: ASHA Worker or Pregnant Mother
- Each role has an icon, description, and contextual image
- Navigation: Back button → "Get Started" button to main app (/)

## Design Features

### Colors
- **Primary**: `#2beede` (Teal/Turquoise)
- **Background Light**: `#f6f8f8`
- **Background Dark**: `#102220`

### Typography
- Font family: **Manrope** (configured in Tailwind)
- Font weights: 400 (regular), 500 (medium), 700 (bold), 800 (extrabold)

### Components
- Rounded corners with custom radius (1rem, 2rem, 3rem)
- Material Icons via `@expo/vector-icons`
- Dark mode support via NativeWind
- Progress indicators for each step

## Usage

### Navigate to Onboarding
To start the onboarding flow from your app:

```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/onboarding1');
```

### Update Index Screen
Update `app/index.tsx` to navigate to onboarding on first launch:

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-background-light">
      <Text className="text-2xl font-bold mb-4">Welcome!</Text>
      <TouchableOpacity
        className="bg-primary px-8 py-4 rounded-full"
        onPress={() => router.push('/onboarding1')}
      >
        <Text className="text-[#102220] font-bold">Start Onboarding</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## File Structure

```
f:\App\GraminHealth\
├── app/
│   ├── _layout.tsx           # Root layout with Stack navigator
│   ├── index.tsx             # Home/main screen
│   ├── onboarding1.tsx       # Route → Onboarding1Welcome
│   ├── onboarding2.tsx       # Route → Onboarding2Language
│   ├── onboarding3.tsx       # Route → Onboarding3Features
│   └── onboarding4.tsx       # Route → Onboarding4Role
├── screens/
│   ├── Onboarding1Welcome.tsx
│   ├── Onboarding2Language.tsx
│   ├── Onboarding3Features.tsx
│   └── Onboarding4Role.tsx
├── tailwind.config.js        # Updated with custom colors & fonts
└── global.css                # Global styles
```

## Customization

### Change Colors
Edit `tailwind.config.js`:

```javascript
colors: {
  primary: "#YOUR_COLOR",
  "background-light": "#YOUR_BG",
  "background-dark": "#YOUR_DARK_BG",
}
```

### Change Navigation Flow
Edit the `onPress` handlers in each screen's navigation buttons to change the flow.

### Add/Remove Languages
Edit the `languages` array in `Onboarding2Language.tsx`:

```tsx
const languages: Language[] = [
  { id: 'en', native: 'English', english: 'English' },
  // Add more languages here
];
```

### Modify Features
Edit the `features` array in `Onboarding3Features.tsx`:

```tsx
const features: Feature[] = [
  {
    icon: 'location',  // Ionicons name
    title: 'Feature Title',
    description: 'Feature description',
  },
  // Add more features
];
```

## Running the App

```bash
# Install dependencies (if not done)
npm install

# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Notes

- All screens support dark mode via NativeWind's `dark:` prefix
- Progress indicators update automatically based on the current screen
- Images are loaded from external URLs - consider downloading them locally for production
- Material Icons are used via `@expo/vector-icons` (included in Expo)
