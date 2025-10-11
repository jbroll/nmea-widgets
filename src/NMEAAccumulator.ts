import {
  type GGAPacket,
  type GSAPacket,
  type GSTPacket,
  type GSVPacket,
  parseNmeaSentence,
} from '@jbroll/nmea-simple';

import type { Satellite as GSVSatellite } from '@jbroll/nmea-simple/codecs/GSV';
import type { ProcessedData } from './nmea-types';

interface Satellite extends GSVSatellite {
  constellation: string;
  lastSeen: number;
}

interface SatelliteUseInfo {
  lastSeen: number;
}

export class NMEAAccumulator {
  private position: GGAPacket | null = null;
  private errorStats: GSTPacket | null = null;
  private visibleSatellites = new Map<string, Satellite>(); // key: constellation-prn
  private satellitesInUse = new Map<number, SatelliteUseInfo>();

  // Timeout for data staleness
  private readonly STALE_THRESHOLD_MS = 5000; // 5 seconds for both in-use and visible

  process(sentence: string) {
    try {
      const parsed = parseNmeaSentence(sentence);

      switch (parsed.sentenceId) {
        case 'GSV':
          this.handleGSV(parsed as GSVPacket);
          break;
        case 'GSA':
          this.handleGSA(parsed as GSAPacket);
          break;
        case 'GGA':
          this.position = parsed as GGAPacket;
          break;
        case 'GST':
          this.errorStats = parsed as GSTPacket;
          break;
      }
    } catch (error) {
      console.error('Error processing NMEA sentence:', error);
    }
  }

  private handleGSV(gsv: GSVPacket) {
    try {
      const now = Date.now();

      if (gsv.satellites) {
        gsv.satellites.forEach((sat) => {
          if (sat.prnNumber > 0) {
            const key = `${sat.prnNumber}`;
            const existingSat = this.visibleSatellites.get(key);

            // Only update if SNR is valid or if the satellite doesn't exist
            if (!existingSat || !Number.isNaN(sat.SNRdB)) {
              this.visibleSatellites.set(key, {
                ...sat,
                constellation: gsv.talkerId ?? '',
                lastSeen: now,
              });
            }
          }
        });
      }

      this.removeStaleData();
    } catch (error) {
      console.error('Error handling GSV:', error);
    }
  }

  private handleGSA(gsa: GSAPacket) {
    const now = Date.now();

    try {
      gsa.satellites.forEach((id) => {
        if (id && id > 0) {
          this.satellitesInUse.set(id, {
            lastSeen: now,
          });
        }
      });

      this.removeStaleData();
    } catch (error) {
      console.error('Error handling GSA:', error);
    }
  }

  private removeStaleData() {
    const now = Date.now();

    // Remove stale satellites in use
    this.satellitesInUse.forEach((info, id) => {
      if (now - info.lastSeen > this.STALE_THRESHOLD_MS) {
        this.satellitesInUse.delete(id);
      }
    });

    // Remove stale visible satellites
    this.visibleSatellites.forEach((sat, key) => {
      if (now - sat.lastSeen > this.STALE_THRESHOLD_MS) {
        this.visibleSatellites.delete(key);
      }
    });
  }

  private convertFixType(fixType: string): number {
    // Map GGA fixType strings to numeric values
    const fixTypeMap: Record<string, number> = {
      none: 0,
      fix: 1,
      delta: 2,
      pps: 3,
      rtk: 4,
      frtk: 5,
      estimated: 6,
      manual: 7,
      simulation: 8,
    };
    return fixTypeMap[fixType] ?? 0;
  }

  getData(): ProcessedData {
    this.removeStaleData();

    return {
      position: this.position
        ? {
            latitude: this.position.latitude,
            longitude: this.position.longitude,
            altitudeMeters: this.position.altitudeMeters,
            fixType: this.convertFixType(this.position.fixType),
            satellites: this.position.satellitesInView,
          }
        : null,
      errorStats: this.errorStats
        ? {
            latitudeError: this.errorStats.latitudeError,
            longitudeError: this.errorStats.longitudeError,
            altitudeError: this.errorStats.altitudeError,
          }
        : null,
      satellites: {
        visible: Array.from(this.visibleSatellites.values()).sort(
          (a, b) => a.prnNumber - b.prnNumber,
        ),
        inUse: Array.from(this.satellitesInUse.keys()).sort((a, b) => a - b),
      },
    };
  }
}
