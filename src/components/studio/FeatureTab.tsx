'use client';

import { useState, useRef, useEffect, ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { UploadProgress } from '@/components/ui';
import styles from './FeatureTab.module.css';

export type FeatureType = 
  | 'paint' | 'bodykit' | 'rims' | 'livery' | 'multicar'
  | 'height' | 'window' | 'background' | 'addPerson'
  | 'videoPrompt' | 'videoDuration' | 'videoScale' | 'videoQuality'
  | 'default';

interface FeatureTabProps {
  isOpen: boolean;
  featureType: FeatureType;
  title: string;
  onClose: () => void;
  onSelection?: (hasSelection: boolean, featureData?: any) => void;
  onDelete?: () => void; // Delete butonu için callback
  initialValues?: any;
  uploadContext?: {
    userId: string;
    projectId: string;
  }; // Mevcut özellik değerleri
}

const WORKER_URL = 'https://media-gateway-cariusb.tahamertsen.workers.dev';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const safeFileName = (file: File): string => {
  const ext = file.name.split('.').pop();
  const base = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .slice(0, 40);
  return `${base || 'file'}.${ext}`;
};

export default function FeatureTab({ isOpen, featureType, title, onClose, onSelection, onDelete, initialValues, uploadContext }: FeatureTabProps) {
  // Her özellik için ayrı state'ler - featureType değiştiğinde sıfırlanır
  const [inputType, setInputType] = useState<'photo' | 'text' | null>(null);
  const [uploadMode, setUploadMode] = useState<'upload' | 'url' | 'instruction'>('upload');
  const [urlValue, setUrlValue] = useState('');
  const [instructionValue, setInstructionValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [windowTint, setWindowTint] = useState(50);
  const [selectedHeight, setSelectedHeight] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState('10');
  const [selectedScale, setSelectedScale] = useState('16:9');
  const [selectedQuality, setSelectedQuality] = useState('standard');
  const [backgroundPrompt, setBackgroundPrompt] = useState('');
  const [personPrompt, setPersonPrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [isVideoPromptModalOpen, setIsVideoPromptModalOpen] = useState(false);
  const [multicarUrls, setMulticarUrls] = useState<string[]>([]); // Multicar için array
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPromptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const stopTextInputPropagation = (
    event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    event.stopPropagation();
  };

  // featureType değiştiğinde state'leri sıfırla
  useEffect(() => {
    setInputType(null);
    setUploadMode('upload');
    setUrlValue('');
    setInstructionValue('');
    setWindowTint(50);
    setSelectedHeight(null);
    setSelectedDuration('10');
    setSelectedScale('16:9');
    setSelectedQuality('standard');
    setBackgroundPrompt('');
    setPersonPrompt('');
    setVideoPrompt('');
    setIsVideoPromptModalOpen(false);
    setMulticarUrls([]);
  }, [featureType]);

  useEffect(() => {
    if (!isVideoPromptModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsVideoPromptModalOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    const focusTimeout = setTimeout(() => videoPromptTextareaRef.current?.focus(), 0);

    return () => {
      clearTimeout(focusTimeout);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isVideoPromptModalOpen]);

  // initialValues değiştiğinde mevcut değerleri yükle
  useEffect(() => {
    if (!initialValues) return;

    switch (featureType) {
      case 'paint':
      case 'bodykit':
        // Hem imageUrl hem instruction birlikte olabilir
        if (initialValues.imageUrl) {
          setInputType('photo');
          setUrlValue(initialValues.imageUrl);
          setUploadMode('url');
        } else {
          setInputType(null);
        }
        // Instruction varsa set et (imageUrl ile birlikte de olabilir)
        if (initialValues.instruction) {
          setInstructionValue(initialValues.instruction);
          // Eğer imageUrl yoksa inputType'ı text yap
          if (!initialValues.imageUrl) {
            setInputType('text');
          }
        } else {
          setInstructionValue('');
        }
        break;
      case 'rims':
      case 'livery':
      case 'multicar':
        if (initialValues.imageUrl) {
          setUrlValue(initialValues.imageUrl);
          setUploadMode('url');
        }
        break;
      case 'addPerson':
        if (initialValues.prompt) setPersonPrompt(initialValues.prompt);
        if (initialValues.imageUrl) {
          setUrlValue(initialValues.imageUrl);
          setUploadMode('url');
        }
        break;
      case 'background':
        if (initialValues.prompt) setBackgroundPrompt(initialValues.prompt);
        break;
      case 'window':
        if (initialValues.tintValue !== undefined) setWindowTint(initialValues.tintValue);
        break;
      case 'height':
        if (initialValues.height) setSelectedHeight(initialValues.height);
        break;
      case 'videoPrompt':
        if (initialValues.prompt) setVideoPrompt(initialValues.prompt);
        break;
      case 'videoDuration':
        if (initialValues.duration !== undefined) setSelectedDuration(initialValues.duration.toString());
        break;
      case 'videoScale':
        if (initialValues.scale) {
          // Scale'i video formatına çevir (1280x720 -> 720p)
          const nextScale = String(initialValues.scale);
          if (nextScale === '1:1' || nextScale === '16:9' || nextScale === '9:16') {
            setSelectedScale(nextScale);
          } else {
            setSelectedScale('16:9');
          }
        }
        break;
      case 'videoQuality':
        if (initialValues.quality) setSelectedQuality(initialValues.quality);
        break;
      case 'multicar':
        if (initialValues.imageUrls && Array.isArray(initialValues.imageUrls)) {
          setMulticarUrls(initialValues.imageUrls);
          if (initialValues.imageUrls.length > 0) {
            setUploadMode('url');
          }
        }
        break;
    }
  }, [featureType, initialValues]);

  // Cloudflare'e dosya yükle (XMLHttpRequest ile progress tracking)
  const uploadToCloudflare = async (file: File): Promise<string> => {
    if (!uploadContext?.userId || !uploadContext?.projectId) {
      throw new Error('Missing upload context');
    }

    const data = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (parseError) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || 'Upload failed (' + xhr.status + ')'));
          } catch {
            reject(new Error('Upload failed (' + xhr.status + ')'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('PUT', WORKER_URL + '/upload/image');
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('x-user-id', uploadContext.userId);
      xhr.setRequestHeader('x-project-id', uploadContext.projectId);
      xhr.send(file);
    });

    const keyOrUrl = data?.key || data?.url;
    if (!keyOrUrl) {
      throw new Error('Upload failed: No key returned');
    }

    setUploadProgress(100);
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      return keyOrUrl;
    }
    return WORKER_URL + '/' + keyOrUrl;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const cloudflareUrl = await uploadToCloudflare(file);
      setUrlValue(cloudflareUrl);
      
      // paint ve bodykit için: foto yüklendiğinde text'i temizleme, ikisini birlikte gönder
      if (featureType === 'paint' || featureType === 'bodykit') {
        setInputType('photo');
        setUploadMode('url'); // Upload tamamlandı, artık URL modunda göster
        // Hem imageUrl hem instruction'ı birlikte gönder (instruction varsa)
        onSelection?.(true, {
          imageUrl: cloudflareUrl,
          instruction: instructionValue.trim() || undefined, // Instruction varsa ekle
        });
      } else if (featureType === 'addPerson') {
        setUploadMode('url');
        onSelection?.(true, {
          prompt: personPrompt,
          imageUrl: cloudflareUrl,
        });
      } else if (featureType === 'multicar') {
        // Multicar için array'e ekle
        const newUrls = [...multicarUrls, cloudflareUrl];
        setMulticarUrls(newUrls);
        setUploadMode('url');
        onSelection?.(true, {
          imageUrls: newUrls,
        });
      } else {
        // rim, livery için sadece imageUrl
        setUploadMode('url');
        onSelection?.(true, {
          imageUrl: cloudflareUrl,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Progress'i biraz gecikmeyle sıfırla (kullanıcının görmesi için)
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleUrlImport = async () => {
    if (!urlValue.trim()) return;

    const url = urlValue.trim();

    if (!uploadContext?.projectId) {
      setUrlValue(url);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    let uploadedUrl = url;
    try {
      const res = await fetch('/api/assets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, projectId: uploadContext.projectId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'URL import failed');
      }
      uploadedUrl = data.url;
    } catch (error) {
      console.error('URL import error:', error);
      alert(error instanceof Error ? error.message : 'URL import failed');
      setUploadProgress(0);
      setIsUploading(false);
      return;
    } finally {
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      setIsUploading(false);
    }

    setUrlValue(uploadedUrl);

    if (featureType === 'paint' || featureType === 'bodykit') {
      setInputType('photo');
      onSelection?.(true, {
        imageUrl: uploadedUrl,
        instruction: instructionValue.trim() || undefined,
      });
    } else if (featureType === 'addPerson') {
      onSelection?.(true, {
        prompt: personPrompt,
        imageUrl: uploadedUrl,
      });
    } else if (featureType === 'multicar') {
      const newUrls = [...multicarUrls, uploadedUrl];
      setMulticarUrls(newUrls);
      onSelection?.(true, {
        imageUrls: newUrls,
      });
    } else {
      onSelection?.(true, {
        imageUrl: uploadedUrl,
      });
    }
  };

  const handleInstructionChange = (value: string) => {
    setInstructionValue(value);
    // paint ve bodykit için: text girildiğinde foto'yu temizleme, ikisini birlikte gönder
    if (featureType === 'paint' || featureType === 'bodykit') {
      setInputType('text');
      // Hem imageUrl hem instruction'ı birlikte gönder (imageUrl varsa)
      onSelection?.(value.trim().length > 0 || urlValue.trim().length > 0, {
        imageUrl: urlValue.trim() || undefined, // ImageUrl varsa ekle
        instruction: value.trim() || undefined, // Instruction varsa ekle
      });
    } else {
      onSelection?.(value.trim().length > 0, {
        instruction: value,
      });
    }
  };

  const handleHeightSelect = (value: string) => {
    setSelectedHeight(value);
    onSelection?.(true, { height: value });
  };

  const handleWindowTintChange = (value: number) => {
    setWindowTint(value);
    onSelection?.(true, { tintValue: value });
  };

  const handleSurpriseMe = () => {
    const prompts = [
      'Neon-lit Tokyo street at night',
      'Snowy mountain pass at dawn',
      'Monaco harbor with yachts',
      'Desert highway at sunset',
      'Rainy London street',
      'Miami beach at golden hour'
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    setBackgroundPrompt(randomPrompt);
    onSelection?.(true, { prompt: randomPrompt });
  };

  const renderContent = () => {
    switch (featureType) {
      case 'paint':
        return (
          <>
            {inputType === null ? (
              <>
                <p className={styles.inputTypeHint}>Yükleme alanı seç</p>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggleBtn} ${styles.large}`}
                    onClick={() => {
                      setInputType('photo');
                      setInstructionValue('');
                    }}
                    disabled={isUploading}
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    Image
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${styles.large}`}
                    onClick={() => {
                      setInputType('text');
                      setUrlValue('');
                    }}
                    disabled={isUploading}
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Text
                  </button>
                </div>
              </>
            ) : inputType === 'photo' ? (
              <>
                <div className={`${styles.toggleGroup} ${styles.compact}`}>
                  <button
                    className={`${styles.toggleBtn} ${uploadMode === 'upload' ? styles.active : ''}`}
                    onClick={() => setUploadMode('upload')}
                    disabled={isUploading}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Upload
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${uploadMode === 'url' ? styles.active : ''}`}
                    onClick={() => setUploadMode('url')}
                    disabled={isUploading}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    URL
                  </button>
                </div>
                <div className={styles.toggleContent}>
                  {uploadMode === 'upload' ? (
                    <div className={`${styles.togglePanel} ${styles.active}`}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.hiddenFileInput}
                        disabled={isUploading}
                      />
                      <button
                        className={styles.uploadMiniBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          'Uploading...'
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            Choose File
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className={`${styles.togglePanel} ${styles.active}`}>
                      <div className={styles.urlMini}>
                        <input
                          type="text"
                          className={styles.urlMiniInput}
                          placeholder="Paste image URL..."
                          value={urlValue}
                          onChange={(e) => setUrlValue(e.target.value)}
                          onKeyDown={stopTextInputPropagation}
                          onKeyPress={(e) => e.key === 'Enter' && !isUploading && handleUrlImport()}
                          disabled={isUploading}
                        />
                        <button className={styles.urlMiniBtn} onClick={handleUrlImport} disabled={isUploading}>
                          {isUploading ? (
                            '...'
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 10 4 15 9 20"></polyline>
                              <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : inputType === 'text' ? (
              <div className={styles.toggleContent}>
                <div className={`${styles.togglePanel} ${styles.active}`}>
                  <input
                    type="text"
                  className={styles.textPromptInput}
                  placeholder="Describe color... e.g. '#020803' or 'red metallic paint'"
                  value={instructionValue}
                  onChange={(e) => handleInstructionChange(e.target.value)}
                  onKeyDown={stopTextInputPropagation}
                />
                </div>
              </div>
            ) : null}
          </>
        );

      case 'bodykit':
        // İki seviyeli seçim: Önce Ref Foto veya Text, sonra Upload/URL veya Text input
        return (
          <>
            {inputType === null ? (
              // İlk seviye: Ref Foto veya Text seçimi
              <>
                <p className={styles.inputTypeHint}>Yükleme alanı seç</p>
                <div className={styles.toggleGroup}>
                <button 
                  className={`${styles.toggleBtn} ${styles.large}`}
                  onClick={() => {
                    setInputType('photo');
                    setInstructionValue(''); // Text'i temizle
                  }}
                  disabled={isUploading}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  Image
                </button>
                <button 
                  className={`${styles.toggleBtn} ${styles.large}`}
                  onClick={() => {
                    setInputType('text');
                    setUrlValue(''); // Foto'yu temizle
                  }}
                  disabled={isUploading}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  Text
                </button>
              </div>
              </>
            ) : inputType === 'photo' ? (
              // İkinci seviye: Upload veya URL
              <>
                <div className={`${styles.toggleGroup} ${styles.compact}`}>
                  <button 
                    className={`${styles.toggleBtn} ${uploadMode === 'upload' ? styles.active : ''}`}
                    onClick={() => setUploadMode('upload')}
                    disabled={isUploading}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Upload
                  </button>
                  <button 
                    className={`${styles.toggleBtn} ${uploadMode === 'url' ? styles.active : ''}`}
                    onClick={() => setUploadMode('url')}
                    disabled={isUploading}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    URL
                  </button>
                </div>
                <div className={styles.toggleContent}>
                  {uploadMode === 'upload' ? (
                    <div className={`${styles.togglePanel} ${styles.active}`}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.hiddenFileInput}
                        disabled={isUploading}
                      />
                      <button 
                        className={styles.uploadMiniBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          'Uploading...'
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            Choose File
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className={`${styles.togglePanel} ${styles.active}`}>
                      <div className={styles.urlMini}>
                        <input
                          type="text"
                          className={styles.urlMiniInput}
                          placeholder="Paste image URL..."
                          value={urlValue}
                          onChange={(e) => setUrlValue(e.target.value)}
                          onKeyDown={stopTextInputPropagation}
                          onKeyPress={(e) => e.key === 'Enter' && !isUploading && handleUrlImport()}
                          disabled={isUploading}
                        />
                        <button 
                          className={styles.urlMiniBtn} 
                          onClick={handleUrlImport}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            '...'
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 10 4 15 9 20"></polyline>
                              <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : inputType === 'text' ? (
              <div className={styles.toggleContent}>
                <div className={`${styles.togglePanel} ${styles.active}`}>
                  <input
                    type="text"
                  className={styles.textPromptInput}
                  placeholder="Describe bodykit... e.g. 'widebody kit' or 'aggressive front lip'"
                  value={instructionValue}
                  onChange={(e) => handleInstructionChange(e.target.value)}
                  onKeyDown={stopTextInputPropagation}
                />
                </div>
              </div>
            ) : null}
          </>
        );

      case 'rims':
      case 'livery':
        // Sadece referans fotoğrafı (Upload veya URL)
        return (
          <>
            <div className={styles.toggleGroup}>
              <button 
                className={`${styles.toggleBtn} ${uploadMode === 'upload' ? styles.active : ''}`}
                onClick={() => setUploadMode('upload')}
                disabled={isUploading}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload
              </button>
              <button 
                className={`${styles.toggleBtn} ${uploadMode === 'url' ? styles.active : ''}`}
                onClick={() => setUploadMode('url')}
                disabled={isUploading}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                URL
              </button>
            </div>
            <div className={styles.toggleContent}>
              {uploadMode === 'upload' ? (
                <div className={`${styles.togglePanel} ${styles.active}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.hiddenFileInput}
                    disabled={isUploading}
                  />
                  <button 
                    className={styles.uploadMiniBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      'Uploading...'
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        Choose File
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className={`${styles.togglePanel} ${styles.active}`}>
                  <div className={styles.urlMini}>
                    <input
                      type="text"
                      className={styles.urlMiniInput}
                      placeholder="Paste image URL..."
                      value={urlValue}
                      onChange={(e) => setUrlValue(e.target.value)}
                      onKeyDown={stopTextInputPropagation}
                      onKeyPress={(e) => e.key === 'Enter' && !isUploading && handleUrlImport()}
                      disabled={isUploading}
                    />
                    <button 
                      className={styles.urlMiniBtn} 
                      onClick={handleUrlImport}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        '...'
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 10 4 15 9 20"></polyline>
                          <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        );

      case 'multicar':
        return (
          <>
            <div className={styles.toggleGroup}>
              <button 
                className={`${styles.toggleBtn} ${uploadMode === 'upload' ? styles.active : ''}`}
                onClick={() => setUploadMode('upload')}
                disabled={isUploading}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload
              </button>
              <button 
                className={`${styles.toggleBtn} ${uploadMode === 'url' ? styles.active : ''}`}
                onClick={() => setUploadMode('url')}
                disabled={isUploading}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                URL
              </button>
            </div>
            <div className={styles.toggleContent}>
              {uploadMode === 'upload' ? (
                <div className={`${styles.togglePanel} ${styles.active}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.hiddenFileInput}
                    disabled={isUploading}
                  />
                  <button 
                    className={styles.uploadMiniBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Choose File'}
                  </button>
                </div>
              ) : (
                <div className={`${styles.togglePanel} ${styles.active}`}>
                  <div className={styles.urlMini}>
                    <input
                      type="text"
                      className={styles.urlMiniInput}
                      placeholder="Paste image URL..."
                      value={urlValue}
                      onChange={(e) => setUrlValue(e.target.value)}
                      onKeyDown={stopTextInputPropagation}
                      onKeyPress={(e) => e.key === 'Enter' && !isUploading && handleUrlImport()}
                      disabled={isUploading}
                    />
                    <button 
                      className={styles.urlMiniBtn} 
                      onClick={handleUrlImport}
                      disabled={isUploading}
                    >
                      {isUploading ? '...' : '→'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        );

      case 'addPerson':
        return (
          <div className={styles.personComposer}>
            <div className={styles.personHint}>
              <span className={styles.personHintTitle}>Required</span>
              <span className={styles.personHintText}>
                Add Person works best with both a reference photo and a short description (outfit, pose, vibe).
              </span>
              <div className={styles.personReqs}>
                <span
                  className={`${styles.personReqItem} ${
                    personPrompt.trim().length > 0 ? styles.ready : ''
                  }`}
                >
                  <span className={styles.personReqDot} aria-hidden="true" /> Description
                </span>
                <span
                  className={`${styles.personReqItem} ${
                    urlValue.trim().length > 0 ? styles.ready : ''
                  }`}
                >
                  <span className={styles.personReqDot} aria-hidden="true" /> Reference photo
                </span>
              </div>
            </div>

            <div className={styles.personInputGroup}>
              <div className={styles.personTextSection}>
                <input
                  type="text"
                  className={`${styles.textPromptInput} ${styles.personPrompt}`}
                  placeholder="Description (required)… e.g. 'man in suit, standing next to the car'"
                  value={personPrompt}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPersonPrompt(next);
                    onSelection?.(next.trim().length > 0 || urlValue.trim().length > 0, {
                      prompt: next,
                      imageUrl: urlValue,
                    });
                  }}
                  onKeyDown={stopTextInputPropagation}
                />
              </div>

              <div className={styles.dividerVertical}></div>

              <div className={styles.personRefSection}>
                <span className={styles.sectionLabel}>Ref</span>
                <div className={`${styles.toggleGroup} ${styles.compact}`}>
                  <button
                    className={`${styles.toggleBtn} ${uploadMode === 'upload' ? styles.active : ''}`}
                    onClick={() => setUploadMode('upload')}
                    disabled={isUploading}
                    type="button"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${uploadMode === 'url' ? styles.active : ''}`}
                    onClick={() => setUploadMode('url')}
                    disabled={isUploading}
                    type="button"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </button>
                </div>

                <div className={styles.toggleContent}>
                  {uploadMode === 'upload' ? (
                    <div className={`${styles.togglePanel} ${styles.active}`}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.hiddenFileInput}
                        disabled={isUploading}
                      />
                      <button
                        className={`${styles.uploadMiniBtn} ${styles.iconOnly}`}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        type="button"
                      >
                        {isUploading ? (
                          '...'
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className={`${styles.togglePanel} ${styles.active}`}>
                      <div className={`${styles.urlMini} ${styles.compact}`}>
                        <input
                          type="text"
                          className={styles.urlMiniInput}
                          placeholder="Reference URL…"
                          value={urlValue}
                          onChange={(e) => setUrlValue(e.target.value)}
                          onKeyDown={stopTextInputPropagation}
                          onKeyPress={(e) => e.key === 'Enter' && !isUploading && handleUrlImport()}
                          disabled={isUploading}
                        />
                        <button
                          className={`${styles.urlMiniBtn} ${styles.small}`}
                          onClick={() => void handleUrlImport()}
                          disabled={isUploading}
                          type="button"
                        >
                          {isUploading ? (
                            '...'
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 10 4 15 9 20"></polyline>
                              <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'background':
        return (
          <div className={styles.textInputGroup}>
            <input
              type="text"
              className={styles.textPromptInput}
              placeholder="Describe background... e.g. 'sunset beach'"
              value={backgroundPrompt}
              onChange={(e) => {
                setBackgroundPrompt(e.target.value);
                onSelection?.(e.target.value.trim().length > 0, {
                  prompt: e.target.value,
                });
              }}
              onKeyDown={stopTextInputPropagation}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && backgroundPrompt.trim().length > 0) {
                  onSelection?.(true, {
                    prompt: backgroundPrompt,
                  });
                }
              }}
            />
            <button className={styles.surpriseBtn} onClick={handleSurpriseMe}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              Surprise Me
            </button>
          </div>
        );

      case 'window':
        return (
          <div className={styles.sliderGroup}>
            <span className={styles.sliderLabel}>Tint Level</span>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                className={styles.tintSlider}
                min="0"
                max="100"
                value={windowTint}
                onChange={(e) => handleWindowTintChange(Number(e.target.value))}
              />
              <div className={styles.sliderValue}>{windowTint}%</div>
            </div>
            <div className={styles.sliderPreview}>
              <div className={styles.previewLight}>Light</div>
              <div className={styles.previewDark}>Dark</div>
            </div>
          </div>
        );

      case 'height':
        return (
          <div className={styles.heightOptions}>
            {['extra-low', 'low', 'high', 'extra-high'].map((value) => (
              <button
                key={value}
                className={`${styles.heightOption} ${selectedHeight === value ? styles.selected : ''}`}
                onClick={() => handleHeightSelect(value)}
                data-value={value}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {value === 'extra-low' && <path d="M12 5v14M5 12l7 7 7-7" />}
                  {value === 'low' && <path d="M12 8v8M8 12l4 4 4-4" />}
                  {value === 'high' && <path d="M12 16V8M8 12l4-4 4 4" />}
                  {value === 'extra-high' && <path d="M12 19V5M5 12l7-7 7 7" />}
                </svg>
                {value.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        );

      case 'videoPrompt':
        return (
          <div className={`${styles.textInputGroup} ${styles.wide}`}>
            <div className={styles.videoPromptRow}>
              <input
                type="text"
                className={`${styles.textPromptInput} ${styles.videoPrompt}`}
                placeholder="Describe the video... e.g. 'Car driving through neon city at night'"
                value={videoPrompt}
                onChange={(e) => {
                  const next = e.target.value;
                  setVideoPrompt(next);
                  onSelection?.(next.trim().length > 0, { prompt: next });
                }}
                onKeyDown={stopTextInputPropagation}
              />
              <button
                type="button"
                className={styles.expandPromptBtn}
                onClick={() => setIsVideoPromptModalOpen(true)}
                aria-label="Expand prompt editor"
                title="Expand"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
            </div>
          </div>
        );

      case 'videoDuration':
        return (
          <div className={styles.durationOptions}>
            {['5', '10'].map((value) => (
              <button
                key={value}
                className={`${styles.durationOption} ${selectedDuration === value ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedDuration(value);
                  onSelection?.(true, {
                    duration: parseInt(value, 10),
                  });
                }}
                data-value={value}
              >
                {value}s
              </button>
            ))}
          </div>
        );

      case 'videoScale':
        return (
          <div className={styles.scaleOptions}>
            {['1:1', '16:9', '9:16'].map((value) => (
              <button
                key={value}
                className={`${styles.scaleOption} ${selectedScale === value ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedScale(value);
                  onSelection?.(true, {
                    scale: value,
                  });
                }}
                data-value={value}
              >
                {value}
              </button>
            ))}
          </div>
        );

      case 'videoQuality':
        return (
          <div className={styles.qualityOptions}>
            {[
              { value: 'draft', name: 'Draft', desc: 'Fast, lower quality' },
              { value: 'standard', name: 'Standard', desc: 'Balanced' },
              { value: 'high', name: 'High', desc: 'Best quality' }
            ].map((option) => (
              <button
                key={option.value}
                className={`${styles.qualityOption} ${selectedQuality === option.value ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedQuality(option.value);
                  onSelection?.(true, {
                    quality: option.value,
                  });
                }}
                data-value={option.value}
              >
                <span className={styles.qualityName}>{option.name}</span>
                <span className={styles.qualityDesc}>{option.desc}</span>
              </button>
            ))}
          </div>
        );

      default:
        return <span className={styles.comingSoon}>Coming Soon</span>;
    }
  };

  if (!isOpen) return null;

  const isTabbedInputFeature = featureType === 'paint' || featureType === 'bodykit';
  const needsInputChoice = isTabbedInputFeature && inputType === null;

  return (
    <>
      <UploadProgress 
        isVisible={isUploading}
        progress={uploadProgress}
        message="Fotoğraf yükleniyor..."
      />
      {featureType === 'videoPrompt' && isVideoPromptModalOpen ? (
        <div
          className={styles.promptModalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Prompt editor"
          onClick={() => setIsVideoPromptModalOpen(false)}
        >
          <div className={styles.promptModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.promptModalHeader}>
              <div className={styles.promptModalTitle}>Edit prompt</div>
              <button
                type="button"
                className={styles.featureTabClose}
                onClick={() => setIsVideoPromptModalOpen(false)}
                aria-label="Close prompt editor"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <textarea
              ref={videoPromptTextareaRef}
              className={styles.promptModalTextarea}
              placeholder="Describe the video... Include camera angle, motion, lighting, and vibe."
              value={videoPrompt}
              onChange={(e) => {
                const next = e.target.value;
                setVideoPrompt(next);
                onSelection?.(next.trim().length > 0, { prompt: next });
              }}
              onKeyDown={stopTextInputPropagation}
              rows={6}
            />

            <div className={styles.promptModalActions}>
              <button
                type="button"
                className={styles.promptModalBtn}
                onClick={() => setIsVideoPromptModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`featureTab ${styles.featureTab} ${isOpen ? styles.open : ''} ${isTabbedInputFeature ? styles.tabbed : ''} ${needsInputChoice ? styles.needsInput : ''}`}
      >
        {isTabbedInputFeature ? (
          <>
            <div className={styles.tabbedHeader}>
              <span className={styles.featureTabTitle}>{title}</span>
              <div className={styles.tabbedHeaderControls}>
                <div className={`${styles.toggleGroup} ${styles.compact}`}>
                  <button
                    className={`${styles.toggleBtn} ${inputType === 'photo' ? styles.active : ''}`}
                    onClick={() => {
                      setInputType('photo');
                      setInstructionValue('');
                    }}
                    disabled={isUploading}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    Photo
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${inputType === 'text' ? styles.active : ''}`}
                    onClick={() => {
                      setInputType('text');
                      setUrlValue('');
                    }}
                    disabled={isUploading}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Text
                  </button>
                </div>

                {onDelete ? (
                  <button
                    className={styles.featureTabDelete}
                    onClick={onDelete}
                    title="Remove this feature"
                    aria-label="Remove this feature"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                ) : null}

                <button className={styles.featureTabClose} onClick={onClose} aria-label="Close feature tab">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12"></path>
                  </svg>
                </button>
            </div>
            </div>
            <div className={styles.featureTabContent}>{renderContent()}</div>
          </>
        ) : (
          <>
            <span className={styles.featureTabTitle}>{title}</span>
            <div className={styles.featureTabContent}>{renderContent()}</div>
            {onDelete && (
              <button
                className={styles.featureTabDelete}
                onClick={onDelete}
                title="Remove this feature"
                aria-label="Remove this feature"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            )}
            <button className={styles.featureTabClose} onClick={onClose} aria-label="Close feature tab">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"></path>
              </svg>
            </button>
          </>
        )}
      </div>
    </>
  );
}




