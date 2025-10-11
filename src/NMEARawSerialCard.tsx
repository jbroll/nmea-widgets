import { useState } from 'react';
import { ChevronDown, ChevronRight } from './ChevronIcons';
import { CopyToClipboard } from './CopyToClipboard';
import { DropdownMenu, type MenuItem } from './DropdownMenu';

interface NMEARawSerialCardProps {
  serialData: string;
  onFilterChange: (sentenceType: string, enabled: boolean) => void;
}

const initialFilterItems: MenuItem[] = [
  {
    id: 'GGA',
    type: 'checkbox',
    label: 'GGA - Global Positioning Fix',
    checked: true,
  },
  {
    id: 'GST',
    type: 'checkbox',
    label: 'GST - Position Error Statistics',
    checked: true,
  },
  {
    id: 'GSA',
    type: 'checkbox',
    label: 'GSA - Active Satellites',
    checked: true,
  },
  {
    id: 'GSV',
    type: 'label',
    label: 'GSV - Satellites in View',
    children: [
      {
        id: 'GSV_GP',
        type: 'checkbox',
        label: 'GPS',
        checked: true,
      },
      {
        id: 'GSV_GL',
        type: 'checkbox',
        label: 'GLONASS',
        checked: true,
      },
      {
        id: 'GSV_GB',
        type: 'checkbox',
        label: 'Galileo',
        checked: true,
      },
      {
        id: 'GSV_BD',
        type: 'checkbox',
        label: 'BeiDou',
        checked: true,
      },
    ],
  },
];

export const NMEARawSerialCard = ({ serialData, onFilterChange }: NMEARawSerialCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterItems, setFilterItems] = useState<MenuItem[]>(initialFilterItems);
  const getRawData = () => serialData;

  const updateFilterItem = (items: MenuItem[], itemId: string, checked: boolean): MenuItem[] => {
    return items.map((item) => {
      if (item.id === itemId) {
        return { ...item, checked };
      }
      if (item.children) {
        return {
          ...item,
          children: updateFilterItem(item.children, itemId, checked),
        };
      }
      return item;
    });
  };

  const handleFilterChange = (itemId: string, checked: boolean) => {
    setFilterItems((prevItems) => updateFilterItem(prevItems, itemId, checked));
    onFilterChange(itemId, checked);
  };

  return (
    <div className="border rounded-lg shadow-sm">
      <div className="p-2 flex items-center justify-between hover:bg-gray-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center flex-grow text-left font-semibold"
        >
          <span className="mr-2">{isOpen ? <ChevronDown /> : <ChevronRight />}</span>
          Raw Serial Data
        </button>
        <div className="flex items-center">
          <DropdownMenu
            items={filterItems}
            onChange={handleFilterChange}
            title="Filter"
            tooltip="Filter NMEA sentences"
            className="mr-2"
          />
          <CopyToClipboard getData={getRawData} title="Copy raw data to clipboard" />
        </div>
      </div>
      {isOpen && (
        <div className="p-2 border-t">
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            {serialData || <span className="text-gray-500">No data available</span>}
          </pre>
        </div>
      )}
    </div>
  );
};
