# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a React/TypeScript component library for visualizing NMEA GPS data in real-time. The library provides React components that work with Web Serial API, Web Bluetooth API, and Geolocation API for connecting to GPS devices and displaying satellite information, position data, and raw NMEA sentences.

Published as `@jbroll/nmea-widgets` on npm.

## Build and Development Commands

### Library Development
- `npm run dev` - Start Vite development server
- `npm run build` - Build production library (TypeScript compilation + Vite build)
- `npm run build:dev` - Build development version with source maps
- `npm run clean` - Remove dist directory
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run Biome linter
- `npm run lint:fix` - Run Biome linter with auto-fix
- `npm run format` - Format code with Biome
- `npm run check` - Run both type-check and lint

### Demo Application
- `cd examples/nmea-demo && npm run dev` - Run demo application locally
- The demo can be used to test changes to the library

### Publishing Workflow
- `make run` - Build library, link it locally, and run demo (for testing before publish)
- `make patch` - Bump patch version (0.5.x → 0.5.y) and publish to npm
- `make publish` - Bump minor version (0.x.0 → 0.y.0) and publish to npm
- `make rc` - Publish release candidate with prerelease tag

Note: Publishing commands automatically update the demo's package.json dependency version and amend the git commit.

## Architecture Overview

### Core Hook Pattern
The library is built around the `useNMEA` hook (src/useNMEA.ts) which manages a **singleton connection state** shared across all hook instances. Key aspects:
- Global state variables (`globalConnection`, `globalAccumulator`, `globalState`) are shared across all `useNMEA` instances
- Listener pattern for state updates - all hook instances subscribe to state changes
- Only one GPS connection can be active at a time, but multiple components can consume the same data
- Accumulated data persists when disconnecting (only connection is reset, not processed data)

### Connection Architecture
The library uses a factory pattern for connection management:

- **ConnectionInterface** (src/ConnectionInterface.ts): Abstract interface defining connect/disconnect/sendCommand/onMessage
- **ConnectionFactory** (src/ConnectionFactory.ts): Creates connection instances and reports browser API support
- **Connection Types**:
  - `SerialConnection` - Web Serial API for USB/serial ports
  - `BluetoothConnection` - Web Bluetooth API for BLE UART devices
  - `GeoLocationConnection` - Browser Geolocation API
- Each connection class has a static `supported` property for feature detection
- **NMEAAccumulator** (src/NMEAAccumulator.ts): Stateful processor that accumulates NMEA data using `@jbroll/nmea-simple`
  - Maintains maps of visible satellites and satellites in use
  - Implements 5-second stale data removal for both satellite visibility and usage
  - Processes GGA, GSA, GSV, and GST sentence types

### Key Components
All components are in `src/` directory:
- **NMEADisplay**: Main all-in-one component providing complete GPS visualization UI
- **NMEADetailView**: Tabbed view showing satellite plot, position info, and raw NMEA data
- **NMEAButton**: Status indicator and connection management dropdown
- **SatellitePlot**: Interactive polar plot of satellite positions with constellation filtering
- **NMEAInfo**: Position and accuracy information display
- **NMEARawSerialCard**: Raw NMEA sentence viewer with filtering
- **NMEAAccumulatorCard**: Shows processed data structure for debugging
- **NMEADataCard**: Container component for data display cards
- **useNMEA**: Core hook managing connection state and data processing

### State Management
The `useNMEA` hook maintains global singleton state with:
- Connection management (connect/disconnect)
- NMEA sentence filtering by type (GGA, GST, GSA) and constellation (GP, GL, GA, GB for GSV)
- Real-time data accumulation with automatic stale data cleanup
- Error handling and connection status
- Support for sending commands to the connected device
- Maximum 100 lines of raw serial data retention

### Type System
All types are exported from `src/nmea-types.ts`:
- `ProcessedData`: Main interface for parsed GPS data (position, errorStats, satellites)
- `Satellite`: Individual satellite information with PRN, elevation, azimuth, SNR, constellation
- `ConnectionInterface` and `ConnectionType`: Connection abstractions
- The library re-exports types from `@jbroll/nmea-simple` for NMEA packets

## Key Development Patterns

### Component Structure
- All components use React functional components with TypeScript
- Styling via Tailwind CSS utility classes
- Components use `clsx` and `tailwind-merge` for conditional class composition
- `class-variance-authority` for component variant patterns
- Components are designed to be standalone while integrating with the shared `useNMEA` state

### Connection Management
- Factory pattern with browser API feature detection
- Connections implement streaming data processing (e.g., SerialConnection uses TransformStream for line buffering)
- Singleton pattern ensures only one active connection while allowing multiple UI components to share the same data stream
- All connections provide async connect/disconnect with proper cleanup

### NMEA Processing Flow
1. Raw data arrives via connection's `onMessage` callback
2. Sentence filtering: Based on type (GGA, GST, GSA, GSV) and constellation (GP, GL, GA, GB for GSV)
3. If sentence passes filter, it's added to `serialData` buffer (max 100 lines)
4. Sentence is parsed by `@jbroll/nmea-simple`
5. Parsed data is accumulated in `NMEAAccumulator` which maintains state
6. Accumulated data is made available via `processedData` to all components

## Important Implementation Notes

### Known Issues
- SerialConnection has a typo: `static Id = 'serail'` instead of `'serial'` (src/SerialConnection.ts:13) - this is in production so cannot be changed without breaking changes

### Build Configuration
- Vite is configured to build as ES module only (`formats: ['es']`)
- TypeScript outputs to `dist/` with declaration files
- External dependencies: react, react-dom, react/jsx-runtime, tailwindcss
- Source maps enabled in build
- Development mode uses `__DEV__` flag

### Tailwind Integration
- Library components use Tailwind classes internally
- Consumers must include library path in their Tailwind config content array
- Uses `tailwindcss-animate` plugin for animations

## Dependencies

### Peer Dependencies (required by consumers)
- `react ^18.0.0` - UI framework
- `react-dom ^18.0.0` - React DOM rendering
- `tailwindcss ^4.1.10` - Styling (consumers must configure)

### Key Runtime Dependencies
- `@jbroll/nmea-simple ^3.3.4` - NMEA sentence parsing (sibling package, often linked locally during development)
- `class-variance-authority` - Component styling variants
- `clsx` and `tailwind-merge` - CSS class composition utilities
- `tailwindcss-animate` - Animation utilities

### Development Dependencies
- `vite` + `@vitejs/plugin-react` - Build tooling
- `vite-plugin-dts` - TypeScript declaration file generation
- `typescript ^5.2.2` - Type checking
- `@types/w3c-web-serial` and `@types/web-bluetooth` - Browser API types

## Browser API Requirements

The library requires modern browser APIs with graceful degradation:
- **Web Serial API** (Chrome 89+, Edge 89+) - detected via `'serial' in navigator`
- **Web Bluetooth API** (Chrome 56+, Edge 79+) - detected via `'bluetooth' in navigator`
- **Geolocation API** (all modern browsers) - detected via `'geolocation' in navigator`

Components automatically hide unsupported connection options based on feature detection.

## Code Quality and Linting

### Biome Configuration
The project uses Biome (v2.1.3) for linting and formatting:
- Enforces `noExplicitAny` error - all types must be explicitly defined
- Warns on non-null assertions (`!`) - prefer optional chaining
- Warns on unused function parameters
- Single quotes for strings, semicolons always
- 100 character line width
- Exception for SatellitePlot.tsx SVG `<g>` elements (accessibility handled via ARIA attributes)

### TypeScript Strict Mode
The project uses strict TypeScript compiler options similar to pin-maker:
- `strict: true` - All strict mode checks enabled
- `exactOptionalPropertyTypes: true` - Optional properties must explicitly include `undefined` in their type
- `noUncheckedIndexedAccess: true` - Array/object access returns `T | undefined`
- `noUnusedLocals: true` - Unused variables are errors
- `noUnusedParameters: true` - Unused parameters are errors
- `noFallthroughCasesInSwitch: true` - Switch cases must break or return

### Path Mapping for Dependencies
To avoid TypeScript checking source .ts files in dependencies with incompatible compiler options, path mappings force use of compiled .d.ts files:
```json
"paths": {
  "@jbroll/nmea-simple": ["./node_modules/@jbroll/nmea-simple/dist/index.d.ts"],
  "@jbroll/nmea-simple/*": ["./node_modules/@jbroll/nmea-simple/dist/*"]
}
```