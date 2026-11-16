import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, AlertTriangle } from 'lucide-react';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from '../../config/constants';
import { p2pService } from '../../services/p2p/p2pService';
import { useRoomStore } from '../../store/useRoomStore';

export const FileDropZone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { peerId } = useRoomStore();

  const isPeerConnected = Boolean(peerId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPeerConnected) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(
          `File "${file.name}" exceeds the ${MAX_FILE_SIZE_LABEL} limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
        );
      } else {
        validFiles.push(file);
      }
    }

    validFiles.forEach((file) => {
      p2pService.offerFile(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isPeerConnected) {
      setFileError('Cannot send files until a peer has joined the room.');
      return;
    }

    processFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => isPeerConnected && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
          !isPeerConnected
            ? 'border-slate-800 bg-slate-900/30 cursor-not-allowed opacity-60'
            : isDragging
            ? 'border-brand-400 bg-brand-950/40 ring-4 ring-brand-500/20 cursor-pointer'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/70 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={!isPeerConnected}
        />

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
            isDragging
              ? 'bg-brand-500/20 text-brand-300'
              : 'bg-slate-800 text-slate-300 group-hover:text-brand-400'
          }`}
        >
          {isDragging ? <FileUp className="w-6 h-6 animate-bounce" /> : <UploadCloud className="w-6 h-6" />}
        </div>

        <p className="text-sm font-medium text-slate-200">
          {isPeerConnected ? (
            <>
              <span className="text-brand-400 font-semibold hover:underline">Choose a file</span> or drag & drop here
            </>
          ) : (
            'Waiting for peer connection to enable file sharing'
          )}
        </p>

        <p className="text-xs text-slate-500 mt-1">
          Max file size: <span className="text-slate-400 font-medium">{MAX_FILE_SIZE_LABEL}</span> • Direct P2P transfer (no cloud storage)
        </p>
      </div>

      {fileError && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{fileError}</span>
        </div>
      )}
    </div>
  );
};
