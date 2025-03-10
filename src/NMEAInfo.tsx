import { CopyToClipboard } from './CopyToClipboard';
import { ProcessedData } from './nmea-types';

export const NMEAInfo = ({ data }: { data: ProcessedData }) => {
  if (!data.position) {
    return (
      <div class="p-4 bg-white rounded-lg shadow">
        <div class="text-center text-gray-500">No Position Fix Available</div>
      </div>
    );
  }

  const accuracy = data.errorStats ? 
    Math.sqrt(Math.pow(data.errorStats.latitudeError, 2) + Math.pow(data.errorStats.longitudeError, 2)) : 
    null;

  const satellitesInUse = data.satellites.inUse.length;

  const getPositionText = () => {
    return `${data.position!.latitude.toFixed(6)},${data.position!.longitude.toFixed(6)}`;
  };

  return (
    <div class="p-2 bg-white rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Position Information</h3>
        <CopyToClipboard
          getData={getPositionText}
          title="Copy coordinates to clipboard"
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        {/* Row 1 */}
        <div>
          <label class="block text-xs text-gray-500 font-medium mb-1">Latitude</label>
          <div class="p-2 bg-gray-50 rounded font-mono">
            {data.position.latitude.toFixed(6)}°
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-500 font-medium mb-1">Longitude</label>
          <div class="p-2 bg-gray-50 rounded font-mono">
            {data.position.longitude.toFixed(6)}°
          </div>
        </div>

        {/* Row 2 */}
        <div>
          <label class="block text-xs text-gray-500 font-medium mb-1">Altitude</label>
          <div class="p-2 bg-gray-50 rounded font-mono">
            {data.position.altitudeMeters.toFixed(1)} m
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-500 font-medium mb-1">Accuracy</label>
          <div class="p-2 bg-gray-50 rounded font-mono">
            {accuracy ? `${accuracy.toFixed(2)} m` : 'N/A'}
          </div>
        </div>

        {/* Row 3 */}
        <div>
          <label class="block text-xs text-gray-500 font-medium mb-1">Fix Type</label>
          <div class="p-2 bg-gray-50 rounded font-mono">
            {data.position.fixType}
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-500 font-medium mb-1">Satellites</label>
          <div class="p-2 bg-gray-50 rounded font-mono">
            {satellitesInUse}
          </div>
        </div>
      </div>
    </div>
  );
};