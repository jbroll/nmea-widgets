import { useState } from 'react';
import { ChevronDown, ChevronRight } from './ChevronIcons';
import { NMEADetailView } from './NMEADetailView';
import type { ProcessedData } from './nmea-types';

interface NMEADataCardProps {
  processedData: ProcessedData;
}

export const NMEADataCard = ({ processedData }: NMEADataCardProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border rounded-lg shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 text-left font-semibold flex items-center hover:bg-gray-50"
      >
        <span className="mr-2">{isOpen ? <ChevronDown /> : <ChevronRight />}</span>
        NMEA Details
      </button>
      {isOpen && (
        <div className="p-2 border-t">
          <NMEADetailView processedData={processedData} />
        </div>
      )}
    </div>
  );
};
