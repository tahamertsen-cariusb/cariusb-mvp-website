/**
 * Kredi Bakiyesi ve Harcama Fonksiyonları
 */

import { createSupabaseClient } from '@/lib/supabase';
import { handleError, logError, ErrorCategory } from '@/lib/errors/errorHandler';

/**
 * Kullanıcının toplam kredi bakiyesini hesapla
 */
export async function getUserCreditBalance(userId: string): Promise<number> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', userId);
  
  if (error) {
    const handledError = handleError(error, {
      operation: 'get_credit_balance',
      userId,
    });
    logError(handledError);
    return 0;
  }
  
  if (!data || data.length === 0) {
    return 0;
  }
  
  // Tüm kredi işlemlerini topla (pozitif = ekleme, negatif = harcama)
  return data.reduce((total, credit) => total + credit.amount, 0);
}

/**
 * Kredi harca
 */
export async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
  jobId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const supabase = createSupabaseClient();
  
  // Önce mevcut bakiyeyi kontrol et
  const currentBalance = await getUserCreditBalance(userId);
  
  if (currentBalance < amount) {
    return {
      success: false,
      newBalance: currentBalance,
      error: 'Insufficient credits'
    };
  }
  
  // Negatif kredi kaydı ekle (harcama)
  const { data, error } = await supabase
    .from('credits')
    .insert({
      user_id: userId,
      amount: -amount, // Negatif = harcama
      source: 'deduction',
      description: reason + (jobId ? ` (Job: ${jobId})` : '')
    })
    .select()
    .single();
  
  if (error) {
    const handledError = handleError(error, {
      operation: 'deduct_credits',
      userId,
      metadata: { amount, reason, jobId },
    });
    logError(handledError);
    return {
      success: false,
      newBalance: currentBalance,
      error: handledError.userMessage
    };
  }
  
  const newBalance = currentBalance - amount;
  
  return {
    success: true,
    newBalance
  };
}

/**
 * Kredi ekle (satın alma, bonus vb.)
 */
export async function addCredits(
  userId: string,
  amount: number,
  source: string,
  description: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('credits')
    .insert({
      user_id: userId,
      amount: amount, // Pozitif = ekleme
      source: source,
      description: description
    })
    .select()
    .single();
  
  if (error) {
    const handledError = handleError(error, {
      operation: 'add_credits',
      userId,
      metadata: { amount, source, description },
    });
    logError(handledError);
    return {
      success: false,
      newBalance: 0,
      error: handledError.userMessage
    };
  }
  
  const currentBalance = await getUserCreditBalance(userId);
  
  return {
    success: true,
    newBalance: currentBalance
  };
}

/**
 * Kredi geçmişini getir
 */
export async function getCreditHistory(
  userId: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  amount: number;
  source: string;
  description: string;
  created_at: string;
}>> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('credits')
    .select('id, amount, source, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    const handledError = handleError(error, {
      operation: 'get_credit_history',
      userId,
      metadata: { limit },
    });
    logError(handledError);
    return [];
  }
  
  return data || [];
}

