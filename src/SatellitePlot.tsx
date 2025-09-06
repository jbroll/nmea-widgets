import { useState, useMemo, useCallback, useEffect, Fragment } from "react";
import { ProcessedData } from "./nmea-types";

// Constants moved to separate file or module to prevent recreation
const SIGNAL_COLORS = {
  STRONG: '#059669',
  GOOD: '#0284C7',
  MODERATE: '#F59E0B',
  WEAK: '#DC2626',
  UNKNOWN: '#6B7280'
} as const;

// Signal strength legend configuration
const SIGNAL_LEGEND = [
  { label: '≥45 dB', color: SIGNAL_COLORS.STRONG },
  { label: '≥35 dB', color: SIGNAL_COLORS.GOOD },
  { label: '≥25 dB', color: SIGNAL_COLORS.MODERATE },
  { label: '<25 dB', color: SIGNAL_COLORS.WEAK }
] as const;

const CONSTELLATION_COLORS = {
  GP: '#15803D',
  GL: '#B91C1C',
  GA: '#1D4ED8',
  GB: '#7C3AED',
  DEFAULT: '#374151'
} as const;

const CONSTELLATION_NAMES = {
  GP: 'GPS',
  GL: 'GLONASS',
  GA: 'Galileo',
  GB: 'BeiDou',
} as const;

// Helper functions moved ougetSNRColortside to prevent recreation
const getSNRColor = (snr: number | null) => {
  if (!snr) return SIGNAL_COLORS.UNKNOWN;
  if (snr >= 45) return SIGNAL_COLORS.STRONG;
  if (snr >= 35) return SIGNAL_COLORS.GOOD;
  if (snr >= 25) return SIGNAL_COLORS.MODERATE;
  return SIGNAL_COLORS.WEAK;
};

const getConstellationColor = (constellation: string) => {
  return CONSTELLATION_COLORS[constellation.substring(0, 2) as keyof typeof CONSTELLATION_COLORS] 
    || CONSTELLATION_COLORS.DEFAULT;
};

// Plot constants
const VIEW_BOX_SIZE = 400;
const CENTER = VIEW_BOX_SIZE / 2;
const RADIUS = CENTER - 10;
const ELEVATION_RINGS = [0, 18, 36, 54, 72, 90];
const AZIMUTH_LINES = [0, 45, 90, 135, 180, 225, 270, 315];
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// Pre-calculate static coordinates
const STATIC_COORDINATES = {
  elevationCoords: ELEVATION_RINGS.map(elevation => {
    const r = RADIUS * (1 - elevation / 90);
    const theta = (26 - 90) * Math.PI / 180;
    return {
      x: CENTER + r * Math.cos(theta),
      y: CENTER + r * Math.sin(theta)
    };
  }),
  azimuthCoords: AZIMUTH_LINES.map(azimuth => {
    const theta = (azimuth - 90) * Math.PI / 180;
    return {
      line: {
        start: {
          x: CENTER + RADIUS * (1 - 75 / 90) * Math.cos(theta),
          y: CENTER + RADIUS * (1 - 75 / 90) * Math.sin(theta)
        },
        end: {
          x: CENTER + RADIUS * (1 - 10 / 90) * Math.cos(theta),
          y: CENTER + RADIUS * (1 - 10 / 90) * Math.sin(theta)
        }
      },
      text: {
        x: CENTER + RADIUS * Math.cos(theta),
        y: CENTER + RADIUS * Math.sin(theta)
      }
    };
  })
};

// Memoized satellite position calculation
const calculateSatellitePosition = (elevation: number, azimuth: number) => {
  const r = RADIUS * (1 - elevation / 90);
  const theta = (azimuth - 90) * Math.PI / 180;
  return {
    x: CENTER + r * Math.cos(theta),
    y: CENTER + r * Math.sin(theta)
  };
};

type VisibilityFilter = 'all' | 'in-use';

export const SatellitePlot = ({ data }: { data: ProcessedData }) => {
  const [hoveredSat, setHoveredSat] = useState<number | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('in-use');
  const [enabledConstellations, setEnabledConstellations] = useState<Set<string>>(
    new Set(Object.keys(CONSTELLATION_NAMES))
  );

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      setHoveredSat(null);
      setVisibilityFilter('in-use');
      setEnabledConstellations(new Set());
    };
  }, []);

  // Stable event handlers
  const handleMouseEnter = useCallback((prnNumber: number) => {
    setHoveredSat(prnNumber);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredSat(null);
  }, []);

  const handleToggleConstellation = useCallback((constellationId: string) => {
    setEnabledConstellations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(constellationId)) {
        newSet.delete(constellationId);
      } else {
        newSet.add(constellationId);
      }
      return newSet;
    });
  }, []);

  // Memoize visible satellites computation
  const visibleSatellites = useMemo(() => {
    if (!data?.satellites?.visible) return [];
    return data.satellites.visible.filter(sat => {
      if (isNaN(sat.elevationDegrees) || isNaN(sat.azimuthTrue)) return false;
      const constId = sat.constellation.substring(0, 2);
      const isEnabled = enabledConstellations.has(constId);
      const isInUse = data.satellites.inUse.includes(sat.prnNumber);
      return isEnabled && (visibilityFilter === 'all' || isInUse);
    });
  }, [data?.satellites?.visible, data?.satellites?.inUse, enabledConstellations, visibilityFilter]);

  // Memoize hover data
  const hoveredSatellite = useMemo(() => {
    if (!hoveredSat || !data?.satellites?.visible) return null;
    return data.satellites.visible.find(sat => sat.prnNumber === hoveredSat) || null;
  }, [hoveredSat, data?.satellites?.visible]);

  return (
    <div className="relative bg-white rounded-lg shadow">
      {/* Filter buttons */}
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-semibold">Satellite View</h3>
        <div className="mt-2">
          <div className="flex space-x-2">
            <button
              onClick={useCallback(() => setVisibilityFilter('in-use'), [])}
              className={`px-2 py-1 text-sm rounded ${
                visibilityFilter === 'in-use'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              In Use
            </button>
            <button
              onClick={useCallback(() => setVisibilityFilter('all'), [])}
              className={`px-2 py-1 text-sm rounded ${
                visibilityFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-2">
        <svg
          viewBox={`0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`}
          className="w-full h-full"
        >
          {ELEVATION_RINGS.map((elevation, i) => (
            <Fragment key={elevation}>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS * (1 - elevation / 90)}
                fill="none"
                stroke="rgb(209 213 219)"
                strokeWidth="1"
              />
              <text
                x={STATIC_COORDINATES.elevationCoords[i].x + 5}
                y={STATIC_COORDINATES.elevationCoords[i].y}
                className="text-xs fill-gray-400"
              >
                {elevation}°
              </text>
            </Fragment>
          ))}

          {STATIC_COORDINATES.azimuthCoords.map(({ line, text }, i) => (
            <Fragment key={AZIMUTH_LINES[i]}>
              <line
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                stroke="rgb(209 213 219)"
                strokeWidth="1"
              />
              <text
                x={text.x}
                y={text.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm fill-gray-500"
              >
                {DIRECTIONS[i]}
              </text>
            </Fragment>
          ))}

          {/* Satellites */}
          {visibleSatellites.map((sat) => {
            const pos = calculateSatellitePosition(sat.elevationDegrees, sat.azimuthTrue);
            const isInUse = data.satellites.inUse.includes(sat.prnNumber);

            return (
              <g
                key={sat.prnNumber}
                onMouseEnter={() => handleMouseEnter(sat.prnNumber)}
                onMouseLeave={handleMouseLeave}
                className="cursor-pointer"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="5"
                  fill={isInUse ? getSNRColor(sat.SNRdB) : SIGNAL_COLORS.UNKNOWN}
                  stroke="white"
                  strokeWidth="0"
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="3"
                  fill={getConstellationColor(sat.constellation)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredSatellite && (
          <div className="absolute top-0 right-2 bg-white/0 p-0 rounded shadow-sm">
            <div className="text-xs">
              <div>PRN: {hoveredSatellite.prnNumber}</div>
              <div>System: {hoveredSatellite.constellation}</div>
              <div>Elevation: {hoveredSatellite.elevationDegrees.toFixed(1)}°</div>
              <div>Azimuth: {hoveredSatellite.azimuthTrue.toFixed(1)}°</div>
              <div>SNR: {hoveredSatellite.SNRdB?.toFixed(1) || 'N/A'} dB</div>
            </div>
          </div>
        )}

        {/* Signal strength legend */}
        <div className="absolute bottom-4 left-4 bg-white/0 p-0 rounded shadow-sm text-xs">
        <div className="text-center text-sm">Signal</div>
          {SIGNAL_LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center">
            <span style={{backgroundColor: color}} className="w-3 h-3 rounded-full mr-1" />
              {label}
            </div>
          ))}
        </div>

        {/* Constellation legend w/toggles */}
        <div className="absolute bottom-4 right-4 bg-white/0 p-0 rounded shadow-sm text-xs">
          <div className="text-center text-sm">System</div>
          {(Object.entries(CONSTELLATION_NAMES) as [keyof typeof CONSTELLATION_NAMES, string][]).map(([id, label]) => (
            <label key={id} className="flex items-center cursor-pointer hover:bg-gray-50 p-0.5 rounded">
              <input
                type="checkbox"
                checked={enabledConstellations.has(id)}
                onChange={() => handleToggleConstellation(id)}
                className="mr-1"
              />
              <span style={{backgroundColor: CONSTELLATION_COLORS[id]}} className="w-3 h-3 rounded-full mx-1" />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
