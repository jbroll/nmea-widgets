import { useState } from 'react';
import { ChevronDown, ChevronRight } from './ChevronIcons';
import { CopyToClipboard } from './CopyToClipboard';
import type { ProcessedData } from './nmea-types';

interface NMEAAccumulatorCardProps {
  processedData: ProcessedData;
}

export const NMEAAccumulatorCard = ({ processedData }: NMEAAccumulatorCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const getProcessedData = () => JSON.stringify(processedData, null, 2);

  return (
    <div className="border rounded-lg shadow-sm">
      <div className="p-2 flex items-center justify-between hover:bg-gray-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center flex-grow text-left font-semibold"
        >
          <span className="mr-2">
            {isOpen ? <ChevronDown /> : <ChevronRight />}
          </span>
          Accumulated NMEA Data
        </button>
        <CopyToClipboard
          getData={getProcessedData}
          title="Copy processed data to clipboard"
        />
      </div>
      {isOpen && (
        <div className="p-2 border-t">
          <pre className="bg-blue-50 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(processedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};