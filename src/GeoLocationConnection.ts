import type { ConnectionInterface } from './ConnectionInterface';

export class GeoLocationConnection implements ConnectionInterface {
  private watchId: number | null = null;
  private messageCallback: ((data: string) => void) | null = null;
  private lastTimestamp: number = 0;
  private updateIntervalMs: number = 1000; // Update frequency

  static supported: boolean = 'geolocation' in navigator;

  static Id = 'geolocation';
  id: string = GeoLocationConnection.Id;

  public async connect(): Promise<void> {
    if (!GeoLocationConnection.supported) {
      throw new Error('Geolocation is not supported in this browser.');
    }

    if (this.isConnected()) {
      throw new Error('Already connected');
    }

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePosition(position),
        (error) => {
          console.error('Geolocation error:', error);
          if (this.messageCallback) {
            // Send a GST sentence with error info
            const gstSentence = this.formatGST(error);
            this.messageCallback(gstSentence);
          }
          this.disconnect();
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        },
      );
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  private handlePosition(position: GeolocationPosition) {
    const now = Date.now();
    if (now - this.lastTimestamp < this.updateIntervalMs) {
      return;
    }
    this.lastTimestamp = now;

    if (this.messageCallback) {
      // Send GGA and GST sentences
      const ggaSentence = this.formatGGA(position);
      const gstSentence = this.formatGST(position);
      this.messageCallback(ggaSentence);
      this.messageCallback(gstSentence);
    }
  }

  private formatGGA(position: GeolocationPosition): string {
    const date = new Date();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const time = `${hours}${minutes}${seconds}.${date.getUTCMilliseconds().toString().padStart(3, '0')}`;

    const lat = position.coords.latitude;
    const latDeg = Math.abs(Math.floor(lat));
    const latMin = (Math.abs(lat) - latDeg) * 60;
    const latStr = `${latDeg.toString().padStart(2, '0')}${latMin.toFixed(4)}`;
    const latDir = lat >= 0 ? 'N' : 'S';

    const lon = position.coords.longitude;
    const lonDeg = Math.abs(Math.floor(lon));
    const lonMin = (Math.abs(lon) - lonDeg) * 60;
    const lonStr = `${lonDeg.toString().padStart(3, '0')}${lonMin.toFixed(4)}`;
    const lonDir = lon >= 0 ? 'E' : 'W';

    // Quality indicator:
    // 1 = GPS fix
    // 2 = DGPS fix
    // We'll use accuracy to determine quality
    const quality = position.coords.accuracy < 10 ? '2' : '1';
    const numSats = '08'; // Mock value as browser doesn't provide satellite count
    const hdop = (position.coords.accuracy / 25).toFixed(1); // Approximate HDOP from accuracy
    const altitude = position.coords.altitude?.toFixed(1) || '0.0';
    const geoidHeight = '0.0';

    const fields = [
      'GPGGA',
      time,
      latStr,
      latDir,
      lonStr,
      lonDir,
      quality,
      numSats,
      hdop,
      altitude,
      'M', // Meters
      geoidHeight,
      'M', // Meters
      '', // Age of differential correction
      '', // Differential reference station ID
    ];

    const sentence = `$${fields.join(',')}`;
    return `${sentence}*${this.calculateChecksum(sentence)}`;
  }

  private formatGST(positionOrError: GeolocationPosition | GeolocationPositionError): string {
    const date = new Date();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const time = `${hours}${minutes}${seconds}.${date.getUTCMilliseconds().toString().padStart(3, '0')}`;

    let rms: string;
    let latError: string;
    let lonError: string;
    let altError: string;

    if (positionOrError instanceof GeolocationPositionError) {
      // Use error codes to set appropriate error values
      switch (positionOrError.code) {
        case GeolocationPositionError.PERMISSION_DENIED:
          rms = latError = lonError = altError = '999.999'; // Permission error
          break;
        case GeolocationPositionError.POSITION_UNAVAILABLE:
          rms = latError = lonError = altError = '888.888'; // Unavailable error
          break;
        case GeolocationPositionError.TIMEOUT:
          rms = latError = lonError = altError = '777.777'; // Timeout error
          break;
        default:
          rms = latError = lonError = altError = '666.666'; // Unknown error
      }
    } else {
      // Convert accuracy to component errors
      // accuracy is the radius of 95% confidence, so divide by 2 for 1σ
      const baseError = (positionOrError.coords.accuracy / 2).toFixed(3);
      rms = baseError;
      latError = baseError;
      lonError = baseError;
      altError = positionOrError.coords.altitudeAccuracy
        ? (positionOrError.coords.altitudeAccuracy / 2).toFixed(3)
        : baseError;
    }

    const fields = [
      'GPGST',
      time,
      rms, // RMS value of the pseudorange residuals
      latError, // Error in latitude
      lonError, // Error in longitude
      '0.000', // Error in altitude
      altError, // Standard deviation of latitude error
      altError, // Standard deviation of longitude error
      altError, // Standard deviation of altitude error
    ];

    const sentence = `$${fields.join(',')}`;
    return `${sentence}*${this.calculateChecksum(sentence)}`;
  }

  private calculateChecksum(sentence: string): string {
    let checksum = 0;
    for (let i = 1; i < sentence.length; i++) {
      checksum ^= sentence.charCodeAt(i);
    }
    return checksum.toString(16).toUpperCase().padStart(2, '0');
  }

  public async disconnect() {
    await this.cleanup();
  }

  private async cleanup() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  public onMessage(callback: (data: string) => void) {
    this.messageCallback = callback;
  }

  public async sendCommand(_command: string) {
    // GeoLocation doesn't support commands
  }

  public isConnected(): boolean {
    return this.watchId !== null;
  }
}
