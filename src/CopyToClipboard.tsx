import { useState } from 'react';
import { ClipboardIcon } from './ClipboardIcon';
import { CheckIcon } from './CheckIcon';

interface CopyToClipboardProps {
  getData: () => string | Promise<string>;
  size?: number;
  className?: string;
  title?: string;
}

export const CopyToClipboard = ({ 
  getData,
  size = 18,
  className = "",
  title = "Copy to clipboard"
}: CopyToClipboardProps) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCopy = async () => {
    try {
      const data = await getData();
      await navigator.clipboard.writeText(data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy data:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
      title={title}
    >
      {showSuccess ? <CheckIcon size={size} /> : <ClipboardIcon size={size} />}
    </button>
  );
};