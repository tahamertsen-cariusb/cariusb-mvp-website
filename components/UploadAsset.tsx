'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

const WORKER_URL = 'https://broad-violet-3cb6.tahamertsen.workers.dev';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

type AssetType = 'image' | 'video';

interface UploadState {
  uploading: boolean;
  error: string | null;
  uploadedUrl: string | null;
  assetType: AssetType | null;
}

const isValidFileType = (file: File): boolean => {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
};

const getValidationError = (file: File): string | null => {
  if (!isValidFileType(file)) {
    return 'Only image or video files are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 100MB.';
  }
  return null;
};

const safeFileName = (file: File): string => {
  const ext = file.name.split('.').pop();
  const base = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .slice(0, 40);

  return `${base || 'file'}.${ext}`;
};

export default function UploadAsset() {
  const supabase = createSupabaseClient();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: null,
    uploadedUrl: null,
    assetType: null,
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;

    if (!selected) {
      setFile(null);
      setState({
        uploading: false,
        error: null,
        uploadedUrl: null,
        assetType: null,
      });
      return;
    }

    const validationError = getValidationError(selected);
    if (validationError) {
      setFile(null);
      setState({
        uploading: false,
        error: validationError,
        uploadedUrl: null,
        assetType: null,
      });
      return;
    }

    const assetType: AssetType = selected.type.startsWith('video/')
      ? 'video'
      : 'image';

    setFile(selected);
    setState({
      uploading: false,
      error: null,
      uploadedUrl: null,
      assetType,
    });
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setState((prev) => ({ ...prev, uploading: true, error: null }));

    try {
      const filename = safeFileName(file);
      const uploadUrl = `${WORKER_URL}?file=${encodeURIComponent(filename)}`;

      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed (${res.status})`);
      }

      const data = await res.json();

      if (!data.success || !data.key) {
        throw new Error('Invalid response from upload service.');
      }

      // Build asset URL from key
      const assetUrl = `${WORKER_URL}/${data.key}`;

      const assetType: AssetType = file.type.startsWith('video/')
        ? 'video'
        : 'image';

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('You must be authenticated to upload files.');
      }

      const { error: insertError } = await supabase.from('assets').insert({
        user_id: user.id,
        project_id: null,
        type: assetType,
        role: 'source',
        url: data.key,
      });

      if (insertError) {
        throw new Error(
          `Failed to save asset: ${insertError.message || 'Database error'}`
        );
      }

      setState((prev) => ({
        ...prev,
        uploading: false,
        uploadedUrl: assetUrl,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        uploading: false,
        error:
          err instanceof Error
            ? err.message
            : 'Unexpected upload error.',
      }));
    }
  };

  const reset = () => {
    setFile(null);
    setState({
      uploading: false,
      error: null,
      uploadedUrl: null,
      assetType: null,
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Upload image or video
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            disabled={state.uploading}
            onChange={handleFileChange}
            className="block w-full text-sm"
          />
          {file && (
            <p className="mt-1 text-xs text-gray-600">
              {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>

        {state.error && (
          <div className="p-2 text-sm text-red-700 bg-red-100 rounded">
            {state.error}
          </div>
        )}

        {state.uploadedUrl && (
          <div className="p-2 text-sm bg-green-100 text-green-800 rounded">
            <p className="font-medium">Upload successful</p>
            <a
              href={state.uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all underline"
            >
              {state.uploadedUrl}
            </a>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!file || state.uploading}
            className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            {state.uploading ? 'Uploading…' : 'Upload'}
          </button>

          {(file || state.uploadedUrl) && (
            <button
              type="button"
              onClick={reset}
              disabled={state.uploading}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
