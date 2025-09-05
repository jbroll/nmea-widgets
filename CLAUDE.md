# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a React/TypeScript component library for visualizing NMEA GPS data in real-time. The library provides React components that work with Web Serial API, Web Bluetooth API, and Geolocation API for connecting to GPS devices and displaying satellite information, position data, and raw NMEA sentences.

## Build and Development Commands

- `npm run dev` - Start Vite development server
- `npm run build` - Build production library (TypeScript compilation + Vite build)
- `npm run build:dev` - Build development version
- `npm run clean` - Remove dist directory
- `make run` - Build and link library for demo testing
- `make publish` - Version bump (minor) and publish to npm
- `make patch` - Version bump (patch) and publish to npm

## Architecture Overview

### Core Hook Pattern
The library is built around the `useNMEA` hook which manages a singleton connection state shared across all instances. This ensures only one GPS connection is active at a time while allowing multiple components to access the same data.

### Connection Architecture
- **ConnectionInterface**: Abstract interface for all connection types
- **ConnectionFactory**: Creates connection instances based on type
- **Connection Types**: SerialConnection, BluetoothConnection, GeoLocationConnection
- **NMEAAccumulator**: Processes and accumulates NMEA sentence data using @jbroll/nmea-simple

### Key Components
- **NMEADisplay**: Main component providing complete GPS visualization UI
- **NMEAButton**: Status indicator and connection management
- **SatellitePlot**: Interactive polar plot of satellite positions
- **NMEAInfo**: Position and accuracy information display
- **useNMEA**: Core hook managing connection state and data processing

### State Management
The `useNMEA` hook maintains global singleton state with:
- Connection management (connect/disconnect)
- NMEA sentence filtering and processing
- Real-time data accumulation
- Error handling and connection status

### Type System
- `ProcessedData`: Main interface for parsed GPS data
- `Satellite`: Individual satellite information
- `ConnectionInterface` and `ConnectionType`: Connection abstractions
- All types exported from `nmea-types.ts`

## Key Development Patterns

### Component Structure
Components follow React patterns with TypeScript, using hooks for state management and Tailwind CSS for styling. All components are designed to be standalone while integrating with the shared `useNMEA` state.

### Connection Management
Connections are managed through the factory pattern with feature detection for browser API support. The singleton pattern ensures only one active connection while allowing multiple UI components to share the same data stream.

### NMEA Processing
NMEA sentences are filtered based on type (GGA, GST, GSA, GSV) and constellation (GPS, GLONASS, Galileo, BeiDou) before being processed by the accumulator for real-time visualization.

## Dependencies

### Peer Dependencies (required)
- `react ^18.0.0` - UI framework
- `react-dom ^18.0.0` - React DOM rendering
- `tailwindcss ^3.4.0` - Styling

### Key Dependencies
- `@jbroll/nmea-simple ^3.3.4` - NMEA sentence parsing
- `class-variance-authority` - Component styling variants
- `clsx` and `tailwind-merge` - CSS class management

## Browser API Requirements

The library requires modern browser APIs:
- **Web Serial API** (Chrome 89+, Edge 89+)
- **Web Bluetooth API** (Chrome 56+, Edge 79+)
- **Geolocation API** (all modern browsers)

Components gracefully handle unsupported APIs by hiding connection options.