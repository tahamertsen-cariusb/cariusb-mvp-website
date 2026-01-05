/**
 * Kredi Hesaplama Sistemi
 * Monetization için kredi maliyet hesaplamaları
 */

// Sabitler
export const CREDIT_MULTIPLIER = 3581; // $0.1 = 3581 kredi
export const BASE_DOLLAR = 0.1;

// Foto maliyetleri (dolar cinsinden)
export const PHOTO_COSTS = {
  '1K': 0.09,   // $0.09
  '2K': 0.09,   // $0.09
  '4K': 0.12,   // $0.12
} as const;

// Video maliyetleri (dolar cinsinden)
export const VIDEO_COSTS = {
  5: 0.21,      // $0.21
  10: 0.42,     // $0.42
} as const;

/**
 * Doları krediye çevir
 */
export function dollarsToCredits(dollars: number): number {
  return Math.round((dollars / BASE_DOLLAR) * CREDIT_MULTIPLIER);
}

/**
 * Foto maliyetini hesapla
 * Not: Tüm modlar birleşik tek foto üretir, bu yüzden tek maliyet
 */
export function calculatePhotoCost(
  resolution: '1K' | '2K' | '4K',
  roiMultiplier: number = 3.50
): number {
  const baseCost = PHOTO_COSTS[resolution];
  const finalCost = baseCost * roiMultiplier;
  return dollarsToCredits(finalCost);
}

/**
 * Video maliyetini hesapla
 * Not: Tek gidiş tek video üretir
 */
export function calculateVideoCost(
  duration: 5 | 10,
  roiMultiplier: number = 1.0
): number {
  const baseCost = VIDEO_COSTS[duration];
  const finalCost = baseCost * roiMultiplier;
  return dollarsToCredits(finalCost);
}

/**
 * ROI çarpanı (plan bazlı)
 * Şimdilik tüm planlar için 1.0, sonra ayarlanacak
 */
export function getROIMultiplier(userPlan: string): number {
  // Şimdilik tüm planlar için 1.0
  // Sonra plan bazlı çarpanlar eklenecek
  const multipliers: Record<string, number> = {
    'free': 1.0,
    'starter': 1.0,
    'pro': 1.0,
    'studio': 1.0,
  };
  return multipliers[userPlan] || 1.0;
}

/**
 * Kredi maliyetini formatla (gösterim için)
 */
export function formatCredits(credits: number): string {
  return credits.toLocaleString('en-US');
}

/**
 * Kredi maliyetini kısa formatta göster (~56K gibi, yuvarlanmış)
 */
export function formatCreditsShort(credits: number): string {
  if (credits >= 1000000) {
    const rounded = Math.round(credits / 100000);
    return `~${rounded / 10}M`.replace(/\.0$/, 'M');
  }
  if (credits >= 1000) {
    const rounded = Math.round(credits / 1000);
    return `~${rounded}K`;
  }
  return `~${credits}`;
}

/**
 * Kredi maliyetini dolar cinsinden göster
 */
export function creditsToDollars(credits: number): number {
  return (credits / CREDIT_MULTIPLIER) * BASE_DOLLAR;
}

