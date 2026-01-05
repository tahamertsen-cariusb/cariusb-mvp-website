'use client';

import { usePathname } from 'next/navigation';
import { Background } from '@/components/layout/Background';
import { CursorGlow } from '@/components/layout/CursorGlow';

export function GlobalDecorations() {
  const pathname = usePathname();

  if (pathname?.startsWith('/design-preview')) {
    return null;
  }

  return (
    <>
      <CursorGlow />
      <Background />
    </>
  );
}

