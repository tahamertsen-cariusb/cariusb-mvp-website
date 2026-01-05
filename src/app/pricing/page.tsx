'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatCreditsShort } from '@/lib/credits/calculator';
import styles from './page.module.css';

interface NitroBoost {
  credits: number;
  price: number;
}

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  annualBilled: string;
  icon: JSX.Element;
  features: {
    text: string;
    enabled: boolean;
  }[];
  buttonText: string;
  buttonLink: string;
  type: 'stock' | 'hero' | 'factory';
}

interface FAQItem {
  question: string;
  answer: string;
}

const nitroBoosts: NitroBoost[] = [
  { credits: 100, price: 9 },
  { credits: 300, price: 24 },
  { credits: 600, price: 45 },
  { credits: 1500, price: 99 },
];

const pricingPlans: PricingPlan[] = [
  {
    name: 'Starter',
    description: 'The stock car. Perfect for test drives.',
    monthlyPrice: 0,
    annualPrice: 0,
    annualBilled: '',
    type: 'stock',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    ),
    features: [
      { text: `${formatCreditsShort(50)} credits / month`, enabled: true },
      { text: 'Standard quality (1024px)', enabled: true },
      { text: '3 garage slots', enabled: true },
      { text: 'Community support', enabled: true },
      { text: 'Video generation', enabled: false },
    ],
    buttonText: 'Start Free',
    buttonLink: '/design-preview',
  },
  {
    name: 'Pro Racer',
    description: 'The GT3 RS. Built for serious creators.',
    monthlyPrice: 29,
    annualPrice: 290,
    annualBilled: 'Billed annually ($290/year)',
    type: 'hero',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    features: [
      { text: `${formatCreditsShort(500)} credits / month`, enabled: true },
      { text: 'High quality (1536px)', enabled: true },
      { text: 'Unlimited garages', enabled: true },
      { text: 'Priority support', enabled: true },
      { text: 'Video generation (10/mo)', enabled: true },
    ],
    buttonText: 'Start Pro Trial',
    buttonLink: '/design-preview',
  },
  {
    name: 'Studio',
    description: 'The factory. For teams & businesses.',
    monthlyPrice: 99,
    annualPrice: 950,
    annualBilled: 'Billed annually ($950/year)',
    type: 'factory',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20h20"/>
        <path d="M5 20V8l5-4v16"/>
        <path d="M10 20v-8l5-2v10"/>
        <path d="M15 20V10l5-2v12"/>
      </svg>
    ),
    features: [
      { text: `${formatCreditsShort(2500)} credits / month`, enabled: true },
      { text: 'Ultra quality (2048px)', enabled: true },
      { text: 'Team collaboration', enabled: true },
      { text: 'Dedicated support', enabled: true },
      { text: 'Unlimited video gen', enabled: true },
    ],
    buttonText: 'Contact Sales',
    buttonLink: 'mailto:contact@cari.app',
  },
];

const faqItems: FAQItem[] = [
  {
    question: 'What are credits and how do they work?',
    answer: 'Credits are your creative fuel. Each photo render costs 10-20 credits depending on quality, while video generation costs 50-100 credits. Unused credits roll over on paid plans. Think of it like gas - use what you need!',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Absolutely. No contracts, no commitment. Cancel anytime and your access continues until the end of your billing period. We believe in earning your business every month.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes! We offer a 14-day money-back guarantee for all paid plans. If CARI doesn\'t meet your expectations, contact support for a full refund. No questions asked.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, Amex), PayPal, and bank transfers for Studio plans. All transactions are secured with bank-level encryption.',
  },
];

const specData = [
  { feature: 'Monthly Credits', starter: formatCreditsShort(50), pro: formatCreditsShort(500), studio: formatCreditsShort(2500) },
  { feature: 'Max Resolution', starter: '1024px', pro: '1536px', studio: '2048px' },
  { feature: 'Garage Slots', starter: '3', pro: 'Unlimited', studio: 'Unlimited' },
  { feature: 'Video Generation', starter: false, pro: '10/mo', studio: 'Unlimited' },
  { feature: 'Priority Processing', starter: false, pro: true, studio: true },
  { feature: 'API Access', starter: false, pro: false, studio: true },
  { feature: 'Team Members', starter: '1', pro: '1', studio: '10+' },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const prices = {
    monthly: [29, 99],
    annual: [24, 79],
  };

  return (
    <>
      <Navbar />
      <main className={styles.pageContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <span className={styles.pageBadge}>🏁 Choose Your Engine</span>
          <h1 className={styles.pageTitle}>
            Power Up Your <span className={styles.highlight}>Garage</span>
          </h1>
          <p className={styles.pageSubtitle}>
            From test drives to unlimited horsepower. Pick the plan that matches your creative ambitions.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className={styles.billingToggleContainer}>
          <span className={`${styles.billingLabel} ${!isAnnual ? styles.active : ''}`}>
            Monthly
          </span>
          <div
            className={`${styles.toggleSwitch} ${isAnnual ? styles.active : ''}`}
            onClick={() => setIsAnnual(!isAnnual)}
          ></div>
          <span className={`${styles.billingLabel} ${isAnnual ? styles.active : ''}`}>
            Annual
          </span>
          <span className={styles.saveBadge}>Save 20%</span>
        </div>

        {/* Nitro Boost Section */}
        <div className={styles.nitroSection}>
          <div className={styles.nitroHeader}>
            <div className={styles.nitroTitle}>
              <div className={styles.nitroIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div>
                <h3>Need for Speed? Top-up Credits.</h3>
                <p className={styles.nitroSubtitle}>One-time purchases. Never expire.</p>
              </div>
            </div>
          </div>
          <div className={styles.nitroGrid}>
            {nitroBoosts.map((boost) => (
              <div key={boost.credits} className={styles.nitroCard}>
                <div className={styles.nitroAmount}>{formatCreditsShort(boost.credits)}</div>
                <div className={styles.nitroLabel}>Credits</div>
                <div className={styles.nitroPrice}>${boost.price}</div>
                <button className={styles.nitroBtn}>Buy Now</button>
              </div>
            ))}
          </div>
        </div>

        {/* Garage Level Section */}
        <div className={styles.garageSection}>
          <div className={styles.sectionLabel}>
            <span>⚙️ Monthly Subscriptions</span>
          </div>

          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan) => {
              const displayPrice = plan.monthlyPrice === 0
                ? 0
                : isAnnual
                ? (plan.type === 'hero' ? prices.annual[0] : prices.annual[1])
                : plan.monthlyPrice;

              return (
                <div key={plan.name} className={`${styles.pricingCard} ${styles[plan.type]}`}>
                  {plan.type === 'hero' && (
                    <span className={styles.popularRibbon}>Most Popular</span>
                  )}
                  <div className={styles.planIcon}>{plan.icon}</div>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <p className={styles.planDesc}>{plan.description}</p>
                  <div className={styles.planPrice}>
                    <div className={styles.priceRow}>
                      <span className={styles.priceCurrency}>$</span>
                      <span className={styles.priceAmount}>{displayPrice}</span>
                      {plan.monthlyPrice > 0 && <span className={styles.pricePeriod}>/mo</span>}
                    </div>
                    {isAnnual && plan.monthlyPrice > 0 && (
                      <p className={styles.priceAnnual}>{plan.annualBilled}</p>
                    )}
                    {plan.monthlyPrice === 0 && (
                      <p className={styles.priceAnnual}>Free forever</p>
                    )}
                  </div>
                  <Link href={plan.buttonLink} className={styles.planBtn}>
                    {plan.buttonText}
                  </Link>
                  <ul className={styles.planFeatures}>
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className={!feature.enabled ? styles.featureDisabled : ''}
                      >
                        <span className={styles.featureCheck}>
                          {feature.enabled ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          )}
                        </span>
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spec Sheet */}
        <div className={styles.specSection}>
          <h2 className={styles.specTitle}>📋 Technical Specifications</h2>
          <table className={styles.specTable}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Starter</th>
                <th className={styles.proCol}>Pro Racer</th>
                <th>Studio</th>
              </tr>
            </thead>
            <tbody>
              {specData.map((row, index) => (
                <tr key={index}>
                  <td>{row.feature}</td>
                  <td>
                    {typeof row.starter === 'boolean' ? (
                      <span className={`${styles.specCheck} ${row.starter ? styles.yes : styles.no}`}>
                        {row.starter ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                      </span>
                    ) : (
                      <span className={styles.specValue}>{row.starter}</span>
                    )}
                  </td>
                  <td className={styles.proCol}>
                    {typeof row.pro === 'boolean' ? (
                      <span className={`${styles.specCheck} ${row.pro ? styles.yes : styles.no}`}>
                        {row.pro ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                      </span>
                    ) : (
                      <span className={styles.specValue}>{row.pro}</span>
                    )}
                  </td>
                  <td>
                    {typeof row.studio === 'boolean' ? (
                      <span className={`${styles.specCheck} ${row.studio ? styles.yes : styles.no}`}>
                        {row.studio ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                      </span>
                    ) : (
                      <span className={styles.specValue}>{row.studio}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className={styles.faqSection}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          {faqItems.map((item, index) => (
            <div
              key={index}
              className={`${styles.faqItem} ${openFaqIndex === index ? styles.open : ''}`}
            >
              <button className={styles.faqQuestion} onClick={() => toggleFaq(index)}>
                {item.question}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              <div className={styles.faqAnswer}>
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
