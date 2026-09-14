// RomVerifier.tsx developed with Claude Sonnet 4
import React, { useState, useRef } from 'react';
import Image from "next/image";

interface RomVerifierProps {
  onMatch: (romFile: File) => void;
  errorMessage?: string | null;
}

const RomVerifier: React.FC<RomVerifierProps> = ({ onMatch, errorMessage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Only process .sfc or .smc files
    const validExtensions = ['.sfc', '.smc'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setFileName(null);
      setLocalError('That file type is not supported. Choose a .sfc or .smc ROM.');
      return;
    }

    setLocalError(null);
    setFileName(file.name);
    onMatch(file);
  };

  const shownError = localError ?? errorMessage ?? null;

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`rom-dropzone text-center p-4
        ${shownError ? 'error-border' : isDragging ? 'active-border' : 'passive-border'}
        dotted-border
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".sfc,.smc"
        className="hidden-input"
      />

      <div className=''>
        <Image
          src="/cloud-upload.svg"
          width={110}
          height={104}
          alt="cloud upload icon"
        />
        {/* One slot, always two lines tall: error, then filename, then
            the default prompt. */}
        {shownError ? (
          <p className="rom-filename rom-filename-error mb-2">
            {shownError}
          </p>
        ) : fileName ? (
          <p className="rom-filename mb-2">
            Selected: <span className="font-semibold">{fileName}</span>
          </p>
        ) : (
          <p className="rom-filename mb-2">
            Drop your ROM file here or
          </p>
        )}

        <button
          onClick={handleBrowseClick}
          className="px-4 py-2 nicer-btn">
          Browse Files
        </button>

        <p className="mt-2 text-xs">
          Supported formats: .sfc, .smc
        </p>
      </div>
    </div>
  );
};

export default RomVerifier;
