'use client';

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import styles from './UploadCard.module.css';

interface UploadCardProps {
  onFileUpload?: (file: File) => void;
  onUrlImport?: (url: string) => void;
}

export default function UploadCard({ onFileUpload, onUrlImport }: UploadCardProps) {
  const [urlValue, setUrlValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  const isUrlReady = useMemo(() => urlValue.trim().length > 0, [urlValue]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && onFileUpload) onFileUpload(files[0]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onFileUpload) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleUrlImport = () => {
    const trimmedUrl = urlValue.trim();
    if (trimmedUrl && onUrlImport) onUrlImport(trimmedUrl);
  };

  return (
    <div
      className={[
        styles.uploadCard,
        isDragging ? styles.isDragging : styles.isIdle,
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload a photo"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
    >
      <div className={styles.blueprint} aria-hidden="true">
        <svg
          width="520"
          height="190"
          viewBox="0 0 280 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M250 70H260C265 70 270 65 270 60V55C270 50 265 47 260 46L240 42C238 42 236 40 235 38L220 20C218 17 214 15 210 15H70C66 15 62 17 60 20L45 38C44 40 42 42 40 42L20 46C15 47 10 50 10 55V60C10 65 15 70 20 70H30"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="55" cy="70" r="18" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="55" cy="70" r="10" stroke="currentColor" strokeWidth="0.9" />
          <circle cx="225" cy="70" r="18" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="225" cy="70" r="10" stroke="currentColor" strokeWidth="0.9" />
          <path
            d="M75 38H205"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M90 15V38"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M190 15V38"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>
      </div>

      <div className={styles.uploadHero}>
        <div className={styles.uploadIconWrapper} aria-hidden="true">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H6a3 3 0 0 0-3 3v2" />
            <path d="M16 3h2a3 3 0 0 1 3 3v2" />
            <path d="M3 16v2a3 3 0 0 0 3 3h2" />
            <path d="M21 16v2a3 3 0 0 1-3 3h-2" />
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 8.5v1.4" />
          </svg>
        </div>

        <h2 className={styles.uploadTitle}>Drag &amp; Drop Your Ride</h2>
        <p className={styles.uploadSubtitle}>veya dosya seçmek için tıkla</p>
      </div>

      <div className={styles.uploadDivider} aria-hidden="true">
        <div className={styles.dividerLine}></div>
        <span className={styles.dividerText}>OR</span>
        <div className={styles.dividerLine}></div>
      </div>

      <div className={styles.urlInputContainer} onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          className={styles.urlInput}
          placeholder="Paste image URL…"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUrlImport();
          }}
        />
        <button
          type="button"
          className={[
            styles.importButton,
            isUrlReady ? styles.importButtonReady : '',
          ].join(' ')}
          disabled={!isUrlReady}
          onClick={(e) => {
            e.stopPropagation();
            handleUrlImport();
          }}
        >
          Import
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.hiddenFileInput}
      />
    </div>
  );
}
