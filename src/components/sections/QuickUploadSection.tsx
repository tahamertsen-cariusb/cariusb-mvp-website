'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import styles from './QuickUploadSection.module.css';

export function QuickUploadSection() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [urlValue, setUrlValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const goToStudio = () => {
    if (isLoggedIn) {
      router.push('/design-preview');
      return;
    }

    router.push('/signup?next=/design-preview');
  };

  const simulateUpload = (previewUrl: string) => {
    setPreview(previewUrl);
    setMessage(null);
    setProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(100, current + 20);
      setProgress(current);
      if (current === 100) {
        clearInterval(interval);
        setMessage('Ready. Continue to Studio.');
      }
    }, 180);
  };

  const handleFileUpload = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    simulateUpload(objectUrl);
  };

  const handleUrlImport = (url: string) => {
    try {
      const parsed = new URL(url);
      simulateUpload(parsed.toString());
    } catch {
      setMessage('Please enter a valid image URL.');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <section className={styles.quickUploadSection} id="quick-upload">
      <div
        className={`${styles.uploadContainer} ${isDragging ? styles.dragover : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={styles.uploadHeader}>
          <div className={styles.uploadIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 className={styles.uploadTitle}>Drop a ride — we’ll take you to Studio</h3>
          <p className={styles.uploadSubtitle}>
            Add a photo or paste a URL, then continue to Studio.
          </p>
        </div>

        <div className={styles.uploadOptions} onClick={(e) => e.stopPropagation()}>
          <div className={styles.uploadInputWrapper}>
            <button className={styles.uploadBtn} type="button" onClick={() => fileInputRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"></path>
                <path d="M5 12h14"></path>
              </svg>
              Upload file
            </button>
          </div>

          <span className={styles.uploadDivider}>or</span>

          <div className={styles.urlInputWrapper}>
            <input
              type="text"
              className={styles.urlInput}
              placeholder="Paste image URL"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlImport(urlValue)}
            />
            <button
              type="button"
              className={styles.urlSubmitBtn}
              onClick={() => handleUrlImport(urlValue)}
            >
              Import
            </button>
          </div>
        </div>

        {preview && (
          <div className={styles.uploadPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className={styles.previewImage} />
            <div className={styles.previewInfo}>Preview ready.</div>
          </div>
        )}

        {progress > 0 && (
          <div className={styles.uploadProgress}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressText}>{progress}%</div>
          </div>
        )}

        {message && <div className={styles.uploadSuccess}>
          <div className={styles.successPreview}>
            {preview && (
              <img src={preview} alt="Uploaded preview" className={styles.previewImage} />
            )}
            <div className={styles.successInfo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {message}
            </div>
          </div>
          <div className={styles.successActions}>
            <button className={styles.studioBtn} onClick={goToStudio}>
              Continue to Studio
            </button>
            <button className={styles.anotherBtn} onClick={() => { setPreview(null); setProgress(0); setMessage(null); }}>
              Drop another
            </button>
          </div>
        </div>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.uploadInput}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </section>
  );
}
