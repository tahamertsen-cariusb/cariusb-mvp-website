'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/stores/authStore';
import { getUserCreditBalance, getCreditHistory } from '@/lib/credits/balance';
import { creditsToDollars, formatCreditsShort } from '@/lib/credits/calculator';
import styles from './page.module.css';

const transactions = [
  { id: '1', type: 'purchase', title: 'Credit Purchase', description: '1,500 credits added', amount: '+1,500', date: 'Dec 15, 2025' },
  { id: '2', type: 'usage', title: 'Image Generation', description: 'BMW M4 Competition - Rims', amount: '-15', date: 'Dec 14, 2025' },
  { id: '3', type: 'usage', title: 'Image Generation', description: 'Porsche 911 GT3 - Paint', amount: '-15', date: 'Dec 12, 2025' },
  { id: '4', type: 'purchase', title: 'Welcome Bonus', description: 'Free credits for new users', amount: '+100', date: 'Dec 10, 2025' },
];

const pricingPlans = [
  { credits: '500', price: '$9.99', perCredit: '$0.02 per credit' },
  { credits: '1,500', price: '$24.99', perCredit: '$0.017 per credit', popular: true },
  { credits: '5,000', price: '$69.99', perCredit: '$0.014 per credit' },
];

export default function BillingPage() {
  const { isLoggedIn, user } = useAuthStore();
  const [userCredits, setUserCredits] = useState<number>(0);
  const [creditHistory, setCreditHistory] = useState<Array<{
    id: string;
    amount: number;
    source: string;
    description: string;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const balance = await getUserCreditBalance(user.id);
        setUserCredits(balance);
        
        const history = await getCreditHistory(user.id, 20);
        setCreditHistory(history);
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn && user?.id) {
      fetchCredits();
    }
  }, [isLoggedIn, user?.id]);

  return (
    <>
      <Navbar />
      <main className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Account Settings</h1>
          <p className={styles.pageSubtitle}>Manage your profile and preferences</p>
        </div>

        <div className={styles.settingsNav}>
          <Link href="/profile" className={styles.settingsNavItem}>Profile</Link>
          <Link href="/settings" className={styles.settingsNavItem}>Settings</Link>
          <Link href="/billing" className={`${styles.settingsNavItem} ${styles.active}`}>Billing</Link>
        </div>

        {/* Credit Balance Card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <span className={styles.balanceLabel}>Available Credits</span>
            <span className={styles.balanceBadge}>
              {user?.user_plan ? user.user_plan.charAt(0).toUpperCase() + user.user_plan.slice(1) + ' Plan' : 'Free Plan'}
            </span>
          </div>
          <div className={styles.balanceAmount}>
            <span className={styles.credits}>
              {isLoading ? '...' : formatCreditsShort(userCredits)}
            </span>
            <span className={styles.label}>credits</span>
          </div>
          <p className={styles.balanceValue}>
            ≈ ${isLoading ? '...' : creditsToDollars(userCredits).toFixed(2)} value
            {user?.user_plan && user.user_plan !== 'free' && ' • Renews Jan 15, 2026'}
          </p>
          <div className={styles.balanceActions}>
            <button className={styles.btnPrimary}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Buy More Credits
            </button>
            <button className={styles.btnSecondary}>Manage Subscription</button>
          </div>
        </div>

        {/* Pricing Options */}
        <div className={styles.pricingSection}>
          <h2 className={styles.sectionTitle}>Top Up Credits</h2>
          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}>
                {plan.popular && <span className={styles.popularBadge}>Most Popular</span>}
                <div className={styles.pricingCredits}>{plan.credits}</div>
                <div className={styles.pricingLabel}>credits</div>
                <div className={styles.pricingPrice}>{plan.price}</div>
                <div className={styles.pricingPer}>{plan.perCredit}</div>
                <button className={styles.pricingBtn}>Purchase</button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className={styles.billingSection}>
          <h2 className={styles.sectionTitle}>Payment Method</h2>
          
          <div className={styles.paymentMethod}>
            <div className={styles.paymentInfo}>
              <div className={styles.cardIcon}>VISA</div>
              <div className={styles.cardDetails}>
                <h4>•••• •••• •••• 4242</h4>
                <p>Expires 12/2027</p>
              </div>
            </div>
            <div className={styles.paymentActions}>
              <button className={styles.btnEdit}>Edit</button>
            </div>
          </div>

          <button className={styles.btnAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Payment Method
          </button>
        </div>

        {/* Transaction History */}
        <div className={styles.billingSection}>
          <h2 className={styles.sectionTitle}>Transaction History</h2>
          
          <div className={styles.transactionList}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#71717A' }}>
                Loading transaction history...
              </div>
            ) : creditHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#71717A' }}>
                No transaction history yet
              </div>
            ) : (
              creditHistory.map((transaction) => {
                const isDeduction = transaction.amount < 0;
                const date = new Date(transaction.created_at);
                const formattedDate = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
                
                return (
                  <div key={transaction.id} className={styles.transactionItem}>
                    <div className={styles.transactionInfo}>
                      <div className={`${styles.transactionIcon} ${isDeduction ? styles.usage : ''}`}>
                        {isDeduction ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        )}
                      </div>
                      <div className={styles.transactionDetails}>
                        <h4>
                          {isDeduction ? 'Credit Usage' : transaction.source === 'signup' ? 'Welcome Bonus' : 'Credit Purchase'}
                        </h4>
                        <p>{transaction.description || transaction.source}</p>
                      </div>
                    </div>
                    <div className={styles.transactionAmount}>
                      <div className={`${styles.amount} ${isDeduction ? styles.negative : ''}`}>
                        {isDeduction ? '' : '+'}{formatCreditsShort(Math.abs(transaction.amount))}
                      </div>
                      <div className={styles.date}>{formattedDate}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

