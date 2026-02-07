# CareNest — Maternal Care Coordination App


## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone or create new Expo project**

   ```bash
   npx create-expo-app CareNest
   cd CareNest
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install NativeWind and Tailwind CSS**

   ```bash
   npm install nativewind
   npm install --save-dev tailwindcss@3.3.2
   ```

4. **Install Expo Vector Icons** (usually pre-installed)

   ```bash
   npx expo install @expo/vector-icons
   ```

### Configuration

5. **Create `tailwind.config.js` in root directory**

   ```javascript
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     content: [
       "./App.{js,jsx,ts,tsx}",
       "./src/**/*.{js,jsx,ts,tsx}"
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

6. **Update `babel.config.js`**

   ```javascript
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: ["nativewind/babel"],
     };
   };
   ```

7. **Create `app.d.ts` for TypeScript support**

   ```typescript
   /// <reference types="nativewind/types" />
   ```

8. **Replace `App.tsx` with the provided code**

   Copy the complete App.tsx code from the artifact.

### Running the App

9. **Start the development server**

   ```bash
   npx expo start
   ```

10. **Run on your preferred platform**

    In the terminal output, press:
    - **`i`** - Open iOS Simulator
    - **`a`** - Open Android Emulator
    - **`w`** - Open in web browser
    - Scan QR code with Expo Go app on your physical device

## 📁 Project Structure

```
CareNest/
├── App.tsx                 # Main application component
├── app.d.ts               # TypeScript definitions for NativeWind
├── babel.config.js        # Babel configuration with NativeWind plugin
├── tailwind.config.js     # Tailwind CSS configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── assets/                # Images and static assets
```


## 🛠️ Technical Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Core mobile framework |
| **TypeScript** | Type-safe development |
| **Expo** | Development platform & tooling |
| **NativeWind** | Tailwind CSS for React Native |
| **@expo/vector-icons** | Icon library (Ionicons) |
| **FlatList** | Optimized list rendering |
