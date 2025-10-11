/// <reference types="web-bluetooth" />

import type { ConnectionInterface } from './ConnectionInterface';

// Common UART/Serial service UUIDs
const UART_SERVICES = [
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
  '0000fefb-0000-1000-8000-00805f9b34fb', // Legacy UART
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip UART
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 UART
];

// Common TX characteristic UUIDs (device -> phone)
const TX_CHARACTERISTICS = [
  '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // Nordic TX
  '0000fefb-0000-1000-8000-00805f9b34fb', // Legacy TX
  '49535343-1e4d-4bd9-ba61-23c647249616', // Microchip TX
  '0000ffe1-0000-1000-8000-00805f9b34fb', // HM-10 TX
];

// Common RX characteristic UUIDs (phone -> device)
const RX_CHARACTERISTICS = [
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // Nordic RX
  '0000fefb-0000-1000-8000-00805f9b34fb', // Legacy RX
  '49535343-8841-43f4-a8d4-ecbe34729bb3', // Microchip RX
  '0000ffe1-0000-1000-8000-00805f9b34fb', // HM-10 RX
];

export class BluetoothConnection implements ConnectionInterface {
  private device: BluetoothDevice | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private messageCallback: ((data: string) => void) | null = null;
  private decoder = new TextDecoder();
  private buffer = '';

  static supported: boolean =
    'bluetooth' in navigator &&
    'requestDevice' in
      (navigator as Navigator & { bluetooth: { requestDevice: unknown } }).bluetooth;
  static Id = 'bluetooth';

  id: string = BluetoothConnection.Id;

  public async connect(): Promise<void> {
    if (!BluetoothConnection.supported) {
      throw new Error('Web Bluetooth is not supported in this browser.');
    }

    if (this.isConnected()) {
      throw new Error('Already connected');
    }

    try {
      const device = await (
        navigator as Navigator & {
          bluetooth: {
            requestDevice: (options: {
              filters: { namePrefix: string }[];
              optionalServices: string[];
            }) => Promise<BluetoothDevice>;
          };
        }
      ).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Express' }, // Adjust this prefix based on your device name
        ],
        optionalServices: [...UART_SERVICES],
      });

      //console.log('Attempting to connect to device:', device.name);
      const gatt = await device?.gatt?.connect();
      if (!gatt) {
        throw new Error('Failed to connect to GATT server');
      }
      //console.log('Connected to GATT server');

      // Log available services
      //const services = await gatt.getPrimaryServices();
      //console.log('Available services:', services.map((s: BluetoothRemoteGATTService) => s.uuid));

      // Try to find a compatible service
      let service: BluetoothRemoteGATTService | null = null;
      for (const serviceId of UART_SERVICES) {
        try {
          service = await gatt.getPrimaryService(serviceId);
          if (service) break;
        } catch (_e) {}
      }

      if (!service) {
        // If no standard service found, try to discover services
        const services = await gatt.getPrimaryServices();
        if (services.length > 0) {
          service = services[0] ?? null; // Use first available service
        } else {
          throw new Error('No compatible services found');
        }
      }

      if (!service) {
        throw new Error('No service available');
      }

      // Try to find TX characteristic
      //console.log('Available characteristics:',
      //  (await service.getCharacteristics()).map((c: BluetoothRemoteGATTCharacteristic) =>
      //    `${c.uuid} (${Object.entries(c.properties).filter(([_k,v]) => v).map(([k]) => k).join(', ')})`
      //  )
      //);

      for (const charId of TX_CHARACTERISTICS) {
        try {
          //console.log('Trying TX characteristic:', charId);
          this.txCharacteristic = await service.getCharacteristic(charId);
          if (this.txCharacteristic) {
            //console.log('Found TX characteristic:', charId);
            break;
          }
        } catch (_e) {}
      }

      // If no standard TX characteristic found, try to discover characteristics
      if (!this.txCharacteristic) {
        const characteristics = await service.getCharacteristics();
        //console.log('Looking for characteristic with notify property');
        this.txCharacteristic = characteristics.find((char) => char.properties.notify) || null;
        if (this.txCharacteristic) {
          //console.log('Found notify characteristic:', this.txCharacteristic.uuid);
        }
      }

      if (!this.txCharacteristic) {
        throw new Error('No compatible TX characteristic found');
      }

      // Set up notifications
      await this.txCharacteristic.startNotifications();
      this.txCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (value && this.messageCallback) {
          const text = this.decoder.decode(value);
          this.buffer += text;

          // Process complete lines
          const lines = this.buffer.split(/\r?\n/);
          this.buffer = lines.pop() || ''; // Keep partial line in buffer

          lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.length > 0 && this.messageCallback) {
              this.messageCallback(trimmed);
            }
          });
        }
      });

      // Try to find RX characteristic for sending commands
      for (const charId of RX_CHARACTERISTICS) {
        try {
          this.rxCharacteristic = await service.getCharacteristic(charId);
          if (this.rxCharacteristic) break;
        } catch (_e) {}
      }

      // If no standard RX characteristic found, try to discover characteristics
      if (!this.rxCharacteristic) {
        const characteristics = await service.getCharacteristics();
        // Look for a characteristic with write property
        this.rxCharacteristic =
          characteristics.find(
            (char) => char.properties.write || char.properties.writeWithoutResponse,
          ) || null;
      }

      this.device = device;
      device.addEventListener('gattserverdisconnected', () => this.cleanup());
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  public async disconnect() {
    await this.cleanup();
  }

  private async cleanup() {
    if (this.txCharacteristic) {
      try {
        await this.txCharacteristic.stopNotifications();
      } catch (e) {
        console.error('Error stopping notifications:', e);
      }
      this.txCharacteristic = null;
    }

    this.rxCharacteristic = null;
    this.buffer = '';

    if (this.device?.gatt?.connected) {
      try {
        await this.device.gatt.disconnect();
      } catch (e) {
        console.error('Error disconnecting GATT:', e);
      }
    }

    this.device = null;
  }

  public async sendCommand(command: string) {
    if (!this.rxCharacteristic) {
      throw new Error('No write characteristic available');
    }

    try {
      const encoder = new TextEncoder();
      await this.rxCharacteristic.writeValue(encoder.encode(`${command}\r\n`));
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  }

  public onMessage(callback: (data: string) => void) {
    this.messageCallback = callback;
  }

  public isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }
}
