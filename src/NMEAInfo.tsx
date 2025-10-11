import { CopyToClipboard } from './CopyToClipboard';
import type { ProcessedData } from './nmea-types';

export const NMEAInfo = ({ data }: { data: ProcessedData }) => {
  if (!data.position) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">No Position Fix Available</div>
      </div>
    );
  }

  // Store position in const to avoid non-null assertions
  const position = data.position;

  const accuracy = data.errorStats
    ? Math.sqrt(data.errorStats.latitudeError ** 2 + data.errorStats.longitudeError ** 2)
    : null;

  const satellitesInUse = data.satellites.inUse.length;

  const getPositionText = () => {
    return `${position.latitude.toFixed(6)},${position.longitude.toFixed(6)}`;
  };

  return (
    <div className="p-2 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Position Information</h3>
        <CopyToClipboard getData={getPositionText} title="Copy coordinates to clipboard" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Row 1 */}
        <div>
          <div className="block text-xs text-gray-500 font-medium mb-1">Latitude</div>
          <div className="p-2 bg-gray-50 rounded font-mono">{position.latitude.toFixed(6)}°</div>
        </div>
        <div>
          <div className="block text-xs text-gray-500 font-medium mb-1">Longitude</div>
          <div className="p-2 bg-gray-50 rounded font-mono">{position.longitude.toFixed(6)}°</div>
        </div>

        {/* Row 2 */}
        <div>
          <div className="block text-xs text-gray-500 font-medium mb-1">Altitude</div>
          <div className="p-2 bg-gray-50 rounded font-mono">
            {position.altitudeMeters.toFixed(1)} m
          </div>
        </div>
        <div>
          <div className="block text-xs text-gray-500 font-medium mb-1">Accuracy</div>
          <div className="p-2 bg-gray-50 rounded font-mono">
            {accuracy ? `${accuracy.toFixed(2)} m` : 'N/A'}
          </div>
        </div>

        {/* Row 3 */}
        <div>
          <div className="block text-xs text-gray-500 font-medium mb-1">Fix Type</div>
          <div className="p-2 bg-gray-50 rounded font-mono">{position.fixType}</div>
        </div>
        <div>
          <div className="block text-xs text-gray-500 font-medium mb-1">Satellites</div>
          <div className="p-2 bg-gray-50 rounded font-mono">{satellitesInUse}</div>
        </div>
      </div>
    </div>
  );
};
