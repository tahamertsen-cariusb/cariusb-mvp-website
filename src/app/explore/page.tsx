import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import styles from './page.module.css';

interface ExploreItem {
  id: string;
  title: string;
  category: string;
  creator: string;
  likes: number;
  views: number;
}

const exploreItems: ExploreItem[] = [
  { id: '1', title: 'Porsche 911 GT3 - Track Day', category: 'Supercars', creator: 'RacerX', likes: 2341, views: 15000 },
  { id: '2', title: 'Nissan R34 Skyline - Midnight', category: 'JDM', creator: 'TokyoDrift', likes: 1892, views: 12000 },
  { id: '3', title: 'BMW M3 E46 - Mountain Road', category: 'European', creator: 'BimmerFan', likes: 1567, views: 9800 },
  { id: '4', title: 'Mustang GT500 - Desert Storm', category: 'American', creator: 'MuscleKing', likes: 1234, views: 8500 },
  { id: '5', title: 'Ferrari 488 - Monaco Bay', category: 'Supercars', creator: 'PrimoDesign', likes: 3021, views: 22000 },
  { id: '6', title: 'Toyota Supra MK4 - City Lights', category: 'JDM', creator: 'SupraLover', likes: 2156, views: 14200 },
  { id: '7', title: 'Lamborghini Aventador - Night', category: 'Supercars', creator: 'BullRun', likes: 2890, views: 19500 },
  { id: '8', title: 'Mercedes AMG GT - Studio Shot', category: 'European', creator: 'StarCreative', likes: 1789, views: 11000 },
];

const categories = ['All', 'JDM', 'European', 'American', 'Supercars', 'Classic', 'Electric'];

const featuredCreators = [
  { name: 'RacerX', works: 127, followers: '45K' },
  { name: 'TokyoDrift', works: 89, followers: '32K' },
  { name: 'PrimoDesign', works: 156, followers: '67K' },
];

export default function ExplorePage() {
  return (
    <>
      <Navbar />
      <main className={styles.exploreContainer}>
        {/* Hero Section */}
        <div className={styles.exploreHero}>
          <span className={styles.heroBadge}>Explore</span>
          <h1 className={styles.heroTitle}>
            Discover <span className={styles.highlight}>Creations</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Get inspired by transformations from our community
          </p>
          
          {/* Search */}
          <div className={styles.searchBar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search cars, creators, or styles..."
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Categories */}
        <div className={styles.categoriesSection}>
          <div className={styles.categoryList}>
            {categories.map((category) => (
              <button 
                key={category}
                className={`${styles.categoryBtn} ${category === 'All' ? styles.active : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainGrid}>
          {/* Explore Grid */}
          <div className={styles.exploreGrid}>
            {exploreItems.map((item) => (
              <div key={item.id} className={styles.exploreCard}>
                <div className={styles.cardThumbnail}>
                  <div className={styles.categoryTag}>{item.category}</div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                    <circle cx="7" cy="17" r="2"/>
                    <circle cx="17" cy="17" r="2"/>
                  </svg>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <div className={styles.cardCreator}>
                    <div className={styles.creatorAvatar}>
                      {item.creator.charAt(0)}
                    </div>
                    <span>{item.creator}</span>
                  </div>
                  <div className={styles.cardStats}>
                    <span className={styles.stat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      {item.likes.toLocaleString()}
                    </span>
                    <span className={styles.stat}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      {(item.views / 1000).toFixed(1)}K
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Featured Creators */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>Top Creators</h3>
              <div className={styles.creatorsList}>
                {featuredCreators.map((creator) => (
                  <div key={creator.name} className={styles.creatorCard}>
                    <div className={styles.creatorAvatar}>
                      {creator.name.charAt(0)}
                    </div>
                    <div className={styles.creatorInfo}>
                      <div className={styles.creatorName}>{creator.name}</div>
                      <div className={styles.creatorStats}>
                        {creator.works} works · {creator.followers} followers
                      </div>
                    </div>
                    <button className={styles.followBtn}>Follow</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Tags */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>Trending Tags</h3>
              <div className={styles.tagsList}>
                {['#widebody', '#japanesetuner', '#nightmode', '#vintage', '#supercar', '#drifting'].map((tag) => (
                  <button key={tag} className={styles.tagBtn}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className={styles.sidebarCta}>
              <h3 className={styles.ctaTitle}>Ready to create?</h3>
              <p className={styles.ctaText}>Start your own transformation</p>
              <Link href="/design-preview" className={styles.ctaBtn}>
                Start Creating
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

