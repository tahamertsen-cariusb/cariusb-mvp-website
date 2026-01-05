'use client';

import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ReactNode } from 'react';

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

