import { BluetoothConnection } from './BluetoothConnection';
import type { ConnectionInterface, ConnectionType } from './ConnectionInterface';
import { GeoLocationConnection } from './GeoLocationConnection';
import { SerialConnection } from './SerialConnection';

const connectionTypes: ConnectionType[] = [
  {
    id: SerialConnection.Id,
    label: 'Serial Port',
    constructor: SerialConnection,
    isSupported: SerialConnection.supported,
  },
  {
    id: BluetoothConnection.Id,
    label: 'Bluetooth',
    constructor: BluetoothConnection,
    isSupported: BluetoothConnection.supported,
  },
  {
    id: GeoLocationConnection.Id,
    label: 'Browser Location',
    constructor: GeoLocationConnection,
    isSupported: GeoLocationConnection.supported,
  },
];

export function createConnection(type: ConnectionType): ConnectionInterface {
  if (!type.isSupported) {
    throw new Error(`Connection type not supported: ${type}`);
  }

  return new type.constructor();
}

export function getConnectionTypes(): ConnectionType[] {
  return connectionTypes;
}

// Export as object for backward compatibility if needed
export const ConnectionFactory = {
  createConnection,
  getConnectionTypes,
};
