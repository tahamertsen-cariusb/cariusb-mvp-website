'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      // Example: logErrorToService(error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className={styles.errorTitle}>Bir şeyler ters gitti</h1>
            <p className={styles.errorMessage}>
              Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya tekrar deneyin.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary className={styles.errorSummary}>Hata Detayları (Sadece Geliştirme)</summary>
                <div className={styles.errorStack}>
                  <strong>Error:</strong> {this.state.error.toString()}
                  <br />
                  {this.state.error.stack && (
                    <>
                      <strong>Stack:</strong>
                      <pre>{this.state.error.stack}</pre>
                    </>
                  )}
                  {this.state.errorInfo && (
                    <>
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
            <div className={styles.errorActions}>
              <button
                className={styles.errorButton}
                onClick={this.handleReset}
                type="button"
              >
                Tekrar Dene
              </button>
              <button
                className={`${styles.errorButton} ${styles.errorButtonSecondary}`}
                onClick={this.handleReload}
                type="button"
              >
                Sayfayı Yenile
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

