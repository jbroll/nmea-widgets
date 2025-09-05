import { ProcessedData } from './nmea-types';
import { NMEAInfo } from './NMEAInfo';
import { SatellitePlot } from './SatellitePlot';

export const NMEADetailView = ({ processedData }: { processedData: ProcessedData }) => {
  return (
    <div className="w-full">
      <div className="lg:grid lg:grid-cols-3 lg:gap-4 space-y-4 lg:space-y-0">
        <div className="lg:col-span-1">
          <NMEAInfo data={processedData} />
        </div>
        <div className="lg:col-span-2">
          <SatellitePlot data={processedData} />
        </div>
      </div>
    </div>
  );
};

