// DownloadRomButton.tsx authored by Claude Sonnet 4 - REFACTORED
import React, { useState } from 'react';

interface DownloadRomButtonProps {
  onGenerateRom: () => Promise<Uint8Array>; // NEW: Function to generate patched ROM
  filename: string;
  disabled?: boolean;
}

const DownloadRomButton: React.FC<DownloadRomButtonProps> = ({ 
  onGenerateRom, 
  filename, 
  disabled = false 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (disabled) return;
    
    setIsGenerating(true);
    
    try {
      // NEW: Generate the patched ROM when download is clicked
      console.log('Generating patched ROM for download...');
      const romData = await onGenerateRom();
      
      // Create and trigger download
      const blob = new Blob([romData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      URL.revokeObjectURL(url);
      
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Error generating ROM for download:', error);
      alert(`Failed to generate patched ROM: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const isButtonDisabled = disabled || isGenerating;

  return (
    <button
      onClick={handleDownload}
      disabled={isButtonDisabled}
      className={`download-btn ${isButtonDisabled ? 'is-disabled' : 'is-ready'}`}
    >
      <div className="download-btn-inner">
        {isGenerating ? (
          // Spinner for generating state
          <svg className="download-btn-icon download-btn-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          // Download icon
          <svg 
            className="download-btn-icon" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        )}
        <span>
          {isGenerating 
            ? 'Generating ROM...' 
            : disabled 
              ? 'No Uploaded ROM' 
              : 'Download BNW ROM'
          }
        </span>
      </div>
    </button>
  );
};

export default DownloadRomButton;