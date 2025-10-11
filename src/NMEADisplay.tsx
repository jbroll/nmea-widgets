import { NMEAAccumulatorCard } from './NMEAAccumulatorCard';
import { NMEAButton } from './NMEAButton';
import { NMEADataCard } from './NMEADataCard';
import { NMEARawSerialCard } from './NMEARawSerialCard';
import { useNMEA } from './useNMEA';

export interface NMEADisplayProps {
  onDetailsClick?: () => void;
}

export const NMEADisplay = ({ onDetailsClick }: NMEADisplayProps) => {
  const { serialData, processedData, setFilter } = useNMEA();

  return (
    <div className="max-w-4xl mx-auto p-2 space-y-1">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">NMEA Data</h1>

        <NMEAButton {...(onDetailsClick ? { detailsLabel: 'NMEA Data', onDetailsClick } : {})} />
      </div>

      <NMEADataCard processedData={processedData} />

      <NMEAAccumulatorCard processedData={processedData} />

      <NMEARawSerialCard serialData={serialData} onFilterChange={setFilter} />
    </div>
  );
};
