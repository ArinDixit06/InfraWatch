# InfraWatch

[![Expo v54](https://img.shields.io/badge/Expo-v54.0.0-blue?logo=expo&logoColor=white)](https://expo.dev)
[![Gemini AI](https://img.shields.io/badge/Powered%20By-Gemini%202.5%20Flash-orange?logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-brightgreen)](https://reactnative.dev)

InfraWatch is a native mobile application built with **React Native** and **Expo** that streamlines civic reporting of road hazards and infrastructure defects across the Delhi-NCR region. Using **Google Gemini Vision AI**, it classifies damage, identifies the correct government jurisdiction (MCD, PWD, NHAI, MCG, GMDA, Noida Authority), and generates bilingual (English & Hindi) formal complaints.

> *"Delhi has over 1,400 km of roads maintained by three different agencies. When you hit a pothole, you don't know if it's MCD, PWD, or NHAI — so most complaints go nowhere. InfraWatch uses Gemini Vision to classify the damage, identify the right authority, and write the complaint for you in under 10 seconds."*

---

## Key Features

- **📸 Dual-Mode Image Intake:** Capture live photos using the device camera or select existing images from the gallery.
- **👁️ Gemini 2.5 Flash Vision AI:** Evaluates structural defects from images, assessing category, severity status, estimated size, surroundings, and safety risks.
- **📍 Location-Aware Header & Routing:** Reverse-geocodes user coordinates to display local status and maps correct municipal jurisdictions automatically.
- **📝 Bilingual Complaint Generation:** Instantly drafts formal civic complaint emails/letters in both English and Hindi.
- **📬 One-Touch Dispatch Tools:** Copy buttons for fields (To, Subject, Body) and direct native email client launcher (`mailto:` integration).
- **🗃️ Local History Database:** Persists reports on-device using `@react-native-async-storage/async-storage` for offline review.
- **📞 Interactive Civic Directory:** City-specific helpline tabs (Delhi, Gurugram, Noida, and National Highways) with dial-triggering links and native X (Twitter) deep-linking support.
- **🖼️ Shareable Report Cards:** Generates clean, visual summary cards of infrastructure issues to export directly to the photo library or share via native channels.

---

## Tech Stack

* **Framework:** React Native (v0.81.5) via Expo SDK (v54.0.0)
* **AI Engine:** `@google/generative-ai` SDK (Gemini 2.5 Flash)
* **Location Services:** `expo-location` (for reverse geocoding & coordinates)
* **Media & Camera:** `expo-image-picker`
* **Storage:** `@react-native-async-storage/async-storage`
* **Sharing & Clipboard:** `expo-sharing`, `expo-clipboard`
* **Icons:** `@expo/vector-icons` (Ionicons)

---

## Installation & Setup

### Prerequisites

Make sure you have Node.js and the Expo Go app (or Emulator) set up on your machine.

### 1. Clone the repository and install dependencies
```bash
cd infrawatch
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of the project:
```env
EXPO_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
> **Note:** The key must be prefixed with `EXPO_PUBLIC_` to be accessible within the Expo client-side bundle.

### 3. Run the Application
Start the Expo development server:
```bash
# Start Metro bundler
npm start

# Run on Android emulator/device
npm run android

# Run on iOS emulator/device
npm run ios

# Run in web browser
npm run web
```

To clear the packager cache while starting, run:
```bash
npx expo start -c
```

---

## Core System Architecture

### 📂 Directory Structure
```
infrawatch/
├── App.js                     # Root component, location permissions & geocoding
├── app.json                   # Expo configuration
├── package.json               # Scripts & dependencies
├── src/
│   ├── components/
│   │   ├── AboutScreen.js     # Mission statement & safety disclaimers
│   │   ├── HistoryScreen.js   # Local history dashboard & detail modals
│   │   ├── NearbyScreen.js    # Interactive local helpline directories
│   │   ├── ReportCard.js      # Shared card layout & image capture hook
│   │   └── ReportScreen.js    # Defect capture form & Gemini analysis output
│   └── utils/
│       └── gemini.js          # Gemini SDK client setup & fallback authority map
```

---

## Civic Jurisdiction & Contact Map

The application maps specific civic divisions based on the city and the type of road class chosen:

| Road Class | Assigned Agency | Primary Jurisdiction |
| :--- | :--- | :--- |
| **Colony / Local Road** | MCD (Delhi) / MCG (Gurugram) / Noida Auth | Local street lights, garbage, sector roads |
| **Arterial / Major Road** | PWD Delhi / GMDA Gurugram / Noida Auth | Flyovers, subways, multi-lane dividers, main drains |
| **Highways & Expressways**| NHAI | National highways (NH-48, DND, Expressway bypasses) |
| **Bridges & Overpasses**  | PWD Bridge Div / GMDA / Noida Auth | Structural repairs, flyover joints |
| **Footbridges & Subways** | MCD / MCG / Noida Auth | Pedestrian subways, skywalk facilities |

---

## Direct Communication Protocols

The application integrates natively with device hardware interfaces:
- **Phone Calls:** Initiates call dialing via `tel:${number}` URIs.
- **X (Twitter) Tagging:** Uses custom deep linking `twitter://user?screen_name=${handle}` to launch the native mobile app, falling back to HTTPS URL redirects in the mobile browser if the app is not installed.
- **Bilingual Mail Dispatch:** Pre-compiles the entire formal complaint body, subject line, and recipient address, launching the device's native mail client using standard `mailto:` deep link parameters.

---

## Safety Disclaimer

InfraWatch is an AI-assisted visual observation tool, not a certified engineering assessment platform. The AI-generated analyses, severity ratings, and risk narratives are based solely on visual heuristics and should not replace professional structural evaluations. In emergency situations with active safety hazards (e.g., bridge collapses, active electrical wires on flooded roads), users must immediately contact unified emergency dispatch services at **112**.
