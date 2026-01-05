import Link from 'next/link';
import styles from './PricingTeaser.module.css';

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Try it out, no credit card',
    href: '/design-preview',
    buttonText: 'Try Now',
    featured: false,
  },
  {
    name: 'Pro Garage',
    price: '$19',
    period: '/mo',
    description: 'For serious creators',
    href: '/design-preview',
    buttonText: 'Get Started',
    featured: true,
  },
  {
    name: 'Business',
    price: 'Custom',
    description: 'For teams & enterprises',
    href: 'mailto:contact@cari.app',
    buttonText: 'Contact Us',
    featured: false,
  },
];

export function PricingTeaser() {
  return (
    <section className={styles.pricingSection} id="pricing">
      <div className={styles.sectionHeader}>
        <span className={styles.sectionBadge}>Pricing</span>
        <h2 className={styles.sectionTitle}>
          Simple <span className={styles.highlight}>Pricing</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Start free, upgrade when you&apos;re ready.
        </p>
      </div>

      <div className={styles.pricingGrid}>
        {pricingPlans.map((plan) => (
          <div 
            key={plan.name} 
            className={`${styles.pricingCard} ${plan.featured ? styles.featured : ''}`}
          >
            {plan.featured && (
              <span className={styles.pricingBadge}>Best Value</span>
            )}
            <h3 className={styles.pricingName}>{plan.name}</h3>
            <div className={styles.pricingPrice}>
              {plan.price}
              {plan.period && <span>{plan.period}</span>}
            </div>
            <p className={styles.pricingDesc}>{plan.description}</p>
            <Link href={plan.href} className={styles.pricingBtn}>
              {plan.buttonText}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

