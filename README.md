# NMEA Widgets

<img align="right" src="images/NMEADisplay.png" alt="NMEA Data Display" width="400">

A modern React component library for visualizing NMEA GPS data in real-time using Web Serial, Web Bluetooth, and Geolocation APIs. Built with TypeScript and Tailwind CSS.

[Try the nmea-demo!](https://jbroll.github.io/nmea-widgets/)

<br clear="all">

## Features

- Multiple connection options:
  - Web Serial API for USB and serial port connections
  - Web Bluetooth API for Bluetooth Low Energy (BLE) UART devices
  - Geolocation API for browser location services
- Real-time NMEA sentence parsing and visualization
- Interactive satellite constellation view showing:
  - GPS, GLONASS, Galileo, and BeiDou satellites
  - Color-coded signal strength indicators (SNR)
  - Elevation and azimuth display
  - Satellite status (in use/visible)
  - Interactive tooltips with detailed satellite info
  - Constellation filtering options
  - Visibility filtering (all/in-use)
- Position information display with:
  - Latitude/Longitude coordinates with copy functionality
  - Altitude in meters
  - Position accuracy (when GST messages available)
  - Fix type and active satellite count
  - Error statistics
- Raw NMEA data view with:
  - Message type filtering
  - Constellation-specific GSV filtering
  - Collapsible interface
  - Copy functionality
- Processed data inspection panel
- Status button component showing:
  - Current connection state
  - Fix quality and accuracy
  - Connection type selection
  - Quick disconnect option
- Responsive design that works on desktop and mobile browsers

## Installation

```bash
npm install @jbroll/nmea-widgets
```

This package has peer dependencies that you'll need to install in your project:

```bash
npm install react react-dom tailwindcss
```

## Setup

1. Configure Tailwind CSS in your project. Add the NMEA Widgets content paths to your `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@jbroll/nmea-widgets/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

2. Import and initialize Tailwind CSS in your application:

```css
/* styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Basic Usage

```tsx
import { NMEADisplay } from '@jbroll/nmea-widgets';

function App() {
  return <NMEADisplay />;
}
```

For more control over the NMEA processing, you can use the `useNMEA` hook and individual components:

```tsx
import { useNMEA, NMEADetailView, NMEAButton } from '@jbroll/nmea-widgets';

function CustomDisplay() {
  const { 
    serialData,
    processedData,
    isConnected,
    connect,
    disconnect,
    setFilter,
    supportedTypes
  } = useNMEA();

  return (
    <div>
      <div className="flex justify-between">
        <h1>GPS Data</h1>
        <NMEAButton 
          detailsLabel="View Details"
          onDetailsClick={() => {
            // Handle details view
          }}
        />
      </div>
      <NMEADetailView processedData={processedData} />
    </div>
  );
}
```

## Components

### NMEADisplay

The main component that provides a complete UI for NMEA data visualization. Automatically manages connection and data processing.

```tsx
<NMEADisplay 
  onDetailsClick={() => {
    // Handle details view navigation
  }}
/>
```

### NMEAButton

A status indicator and connection management button.

```tsx
<NMEAButton
  detailsLabel="View Details"       // Optional label for details action
  onDetailsClick={() => {}}         // Optional callback for details action
  className="custom-styles"         // Optional class name for styling
/>
```

Features:
- Shows connection status with color coding
- Displays current fix type and accuracy when connected
- Dropdown menu for connection type selection
- Quick disconnect option
- Optional details callback
- Customizable styling

### SatellitePlot

A standalone component for visualizing satellite positions and signal strengths.

```tsx
import { SatellitePlot } from '@jbroll/nmea-widgets';

<SatellitePlot data={processedData} />
```

Features:
- Interactive polar plot showing satellite positions
- Color-coded signal strength indicators
- Constellation filtering (GPS, GLONASS, Galileo, BeiDou)
- Visibility filtering (all satellites vs in-use only)
- Hover tooltips with detailed satellite information
- Elevation rings and azimuth markers
- Signal strength and constellation legends

### NMEAInfo

Displays position information and accuracy metrics.

```tsx
import { NMEAInfo } from '@jbroll/nmea-widgets';

<NMEAInfo data={processedData} />
```

Features:
- Current position display (latitude, longitude)
- Altitude information
- Position accuracy (when available)
- Fix type indicator
- Active satellite count
- Copy coordinates functionality

### useNMEA Hook

A React hook that handles device communication and NMEA data processing.

```tsx
const {
  serialData,         // Raw NMEA sentences
  processedData,      // Parsed and processed NMEA data
  isConnected,        // Connection state
  isConnecting,       // Connection in progress
  error,              // Error state
  connect,            // Function to initiate connection
  disconnect,         // Function to close connection
  sendCommand,        // Function to send commands to device
  setFilter,          // Function to filter NMEA sentences
  supportedTypes,     // Array of supported connection types
  connection          // Current connection interface
} = useNMEA();
```

## Types

### ProcessedData

```typescript
interface ProcessedData {
  position: {
    latitude: number;
    longitude: number;
    altitudeMeters: number;
    fixType: number;
    satellites: number;
  } | null;
  errorStats: {
    latitudeError: number;
    longitudeError: number;
    altitudeError: number;
  } | null;
  satellites: {
    visible: Satellite[];
    inUse: number[];
  };
}

interface Satellite {
  prnNumber: number;
  elevationDegrees: number;
  azimuthTrue: number;
  SNRdB: number;
  constellation: string;
}
```

### Supported NMEA Messages

The library currently supports parsing these NMEA sentence types:
- GGA (Global Positioning System Fix Data)
- GSA (GNSS DOP and Active Satellites)
- GSV (GNSS Satellites in View)
- GST (GNSS Pseudorange Error Statistics)

Supported constellations:
- GPS (GP)
- GLONASS (GL)
- Galileo (GA)
- BeiDou (GB)

## Browser Support

### Web Serial API
- Google Chrome (desktop) version 89+
- Microsoft Edge (desktop) version 89+
- Opera (desktop) version 75+
- Chrome for Android (with flag enabled)

### Web Bluetooth API
- Google Chrome (desktop) version 56+
- Microsoft Edge (desktop) version 79+
- Opera (desktop) version 43+
- Chrome for Android version 56+
- Samsung Internet version 6.0+

### Geolocation API
- All modern browsers

### Bluetooth Device Compatibility
The library supports various UART/Serial over Bluetooth LE services including:
- Nordic UART (UUID: 6E400001-B5A3-F393-E0A9-E50E24DCCA9E)
- Legacy UART (UUID: 0000FEFB-0000-1000-8000-00805F9B34FB)
- Microchip UART (UUID: 49535343-FE7D-4AE5-8FA9-9FAFD205E455)
- HM-10 UART (UUID: 0000FFE0-0000-1000-8000-00805F9B34FB)

## Development

To build the library:

```bash
npm install
npm run build
```

To run the demo application:

```bash
cd examples/nmea-demo
npm install
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

The project uses:
- React for UI components
- TypeScript for type safety
- Tailwind CSS for styling
- Vite for building and development
- Web Serial API for USB/serial communication
- Web Bluetooth API for BLE communication
- nmea-simple for NMEA sentence parsing

## License

MIT License - see LICENSE file for details