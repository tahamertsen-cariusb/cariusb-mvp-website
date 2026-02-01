'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import styles from './page.module.css';

interface FeatureStep {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  label: string;
  icon: JSX.Element;
}

const featureSteps: FeatureStep[] = [
  {
    step: 1,
    title: 'Upload Image',
    subtitle: 'Start with any car photo',
    description: 'Drop any car photo and our AI instantly analyzes it. Works with any angle, any lighting, any car model.',
    label: 'Original',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    step: 2,
    title: 'AI Paint Shop',
    subtitle: 'Colors & Liveries',
    description: 'Change to any color imaginable. Apply racing liveries, custom graphics, or let AI suggest trending combinations.',
    label: 'Paint Shop',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Virtual Mechanic',
    subtitle: 'Bodykits & Stance',
    description: 'Add widebody kits, lower the suspension, install splitters and diffusers. Transform the silhouette completely.',
    label: 'Virtual Mechanic',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    ),
  },
  {
    step: 4,
    title: 'Wheel Swap',
    subtitle: 'Rims & Fitment',
    description: 'Choose from thousands of wheel designs. Forged, multi-piece, deep dish — perfect fitment every time.',
    label: 'Wheel Swap',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
      </svg>
    ),
  },
  {
    step: 5,
    title: 'Background Shift',
    subtitle: 'Scene & Environment',
    description: 'Transport your car anywhere. Rainy Tokyo streets, Monaco harbor, mountain passes — or describe your own scene.',
    label: 'Background Shift',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    step: 6,
    title: 'Motion Magic',
    subtitle: 'AI Video Generation',
    description: 'Turn your creation into a cinematic video. Headlights glow, rain falls, smoke rises — pure automotive cinema.',
    label: 'Motion Magic',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
  },
];

const videoData = {
  demo: {
    title: 'Watch AI Video Generation',
    duration: '2:34',
    description: 'See a car transform into cinematic video in real-time',
  },
  tutorial: {
    title: 'Step-by-Step Tutorial',
    duration: '4:12',
    description: 'Learn how to create professional car videos',
  },
  showcase: {
    title: 'Community Showcase',
    duration: '3:45',
    description: 'Amazing videos created by our community',
  },
};

const videoShowcaseUrl =
  'https://zhfoygasvpjtsngebahn.supabase.co/storage/v1/object/public/website-items/0ad6dbfc14c5de3af47ab8db5501bd6d_1767506449.mp4';

const videoFeatures = [
  {
    title: 'Prompt',
    description: 'Describe your video scene in natural language',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    locked: false,
  },
  {
    title: 'Duration',
    description: '5s, 10s, 15s, or 30s video lengths',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    locked: false,
  },
  {
    title: 'Quality',
    description: 'Draft, Standard, or Ultra render quality',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
      </svg>
    ),
    locked: false,
  },
  {
    title: 'Storyboard',
    description: 'Multi-shot sequences with transitions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    locked: true,
  },
];

const stageImages: Partial<Record<number, string>> = {
  1: 'https://zhfoygasvpjtsngebahn.supabase.co/storage/v1/object/public/website-items/s15.PNG',
  2: 'https://zhfoygasvpjtsngebahn.supabase.co/storage/v1/object/public/website-items/1767503732942-lt3judq58d.png',
  3: 'https://zhfoygasvpjtsngebahn.supabase.co/storage/v1/object/public/website-items/98f826214e89fb45b440087bc0e13f80_1767504290.png',
  4: 'https://zhfoygasvpjtsngebahn.supabase.co/storage/v1/object/public/website-items/1767504555806-2qftbxb6xg2.png',
  5: 'https://zhfoygasvpjtsngebahn.supabase.co/storage/v1/object/public/website-items/image.png',
};

const getPlaceholderContent = (step: number) => {
  const placeholders = [
    { icon: 'upload', text: 'Stock Photo Uploaded' },
    { icon: 'paint', text: 'Lava Orange Paint Applied' },
    { icon: 'bodykit', text: 'Widebody Kit + Lowered Stance' },
    { icon: 'rims', text: 'Custom Forged Wheels' },
    { icon: 'background', text: 'Tokyo Night Scene' },
    { icon: 'video', text: 'Cinematic AI Video' },
  ];
  return placeholders[step - 1] || placeholders[0];
};

export default function FeaturesPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const [activeVideoTab, setActiveVideoTab] = useState<'demo' | 'tutorial' | 'showcase'>('demo');
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_PLAY_DELAY = 5000;

  useEffect(() => {
    if (!isHovering) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev >= 6 ? 1 : prev + 1));
      }, AUTO_PLAY_DELAY);
    } else {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isHovering]);

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  const currentVideoData = videoData[activeVideoTab];

  return (
    <>
      <Navbar />
      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <span className={styles.heroBadge}>✨ The Evolution</span>
          <h1 className={styles.heroTitle}>
            Watch the <span className={styles.highlight}>Transformation</span>
          </h1>
          <p className={styles.heroSubtitle}>
            See how a single photo transforms step by step. Click each feature or let it auto-play.
          </p>
        </section>

        {/* Interactive Feature Showcase */}
        <section className={styles.showcaseSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>📸 Photo Mode</span>
            <h2 className={styles.sectionTitle}>
              One Photo. <span className={styles.highlight}>Endless Possibilities.</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              From wheel swaps to full-body transformations, our AI understands cars like no other.
            </p>
          </div>

          <div className={styles.featureShowcase}>
            {/* The Stage - Left Side */}
            <div className={styles.featureStage}>
              {featureSteps.map((step) => {
                const placeholder = getPlaceholderContent(step.step);
                const stageImageUrl = stageImages[step.step] ?? null;
                return (
                  <div
                    key={step.step}
                    className={`${styles.stageImage} ${currentStep === step.step ? styles.active : ''}`}
                    data-step={step.step}
                  >
                    {stageImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={stageImageUrl} alt={step.title} className={styles.stageMedia} loading="lazy" />
                    ) : (
                      <div className={styles.stagePlaceholder}>
                        {step.icon}
                        <span>{placeholder.text}</span>
                      </div>
                    )}
                    <span className={styles.stageLabel}>{step.label}</span>
                    <span className={styles.stageStep}>
                      {String(step.step).padStart(2, '0')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Control Deck - Right Side */}
            <div
              className={styles.controlDeck}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {featureSteps.map((step) => (
                <div
                  key={step.step}
                  className={`${styles.controlItem} ${currentStep === step.step ? styles.active : ''}`}
                  onClick={() => handleStepClick(step.step)}
                >
                  <div className={styles.controlHeader}>
                    <div className={styles.controlIcon}>{step.icon}</div>
                    <div className={styles.controlText}>
                      <div className={styles.controlTitle}>{step.title}</div>
                      <div className={styles.controlSubtitle}>{step.subtitle}</div>
                    </div>
                  </div>
                  <p className={styles.controlDescription}>{step.description}</p>
                  <div className={styles.controlProgress}></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video Mode Features */}
        <section className={styles.videoFeaturesSection}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionBadge} ${styles.videoBadge}`}>🎬 Video Mode</span>
            <h2 className={styles.sectionTitle}>
              Bring Your Car to <span className={styles.highlight}>Life</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Generate cinematic AI videos from your renders. Perfect for Reels, TikTok, and YouTube.
            </p>
          </div>

          {/* Video Showcase */}
          <div className={styles.videoShowcase}>
            <div className={styles.videoContainer}>
              <div className={styles.videoPlayer}>
                <VideoPlayer
                  key={activeVideoTab}
                  src={videoShowcaseUrl}
                  overlayTitle={currentVideoData.title}
                  overlaySubtitle={currentVideoData.description}
                  aspectRatio="16 / 9"
                />
              </div>
              <div className={styles.videoControls}>
                <div className={styles.videoTabs}>
                  <button
                    className={`${styles.videoTab} ${activeVideoTab === 'demo' ? styles.active : ''}`}
                    onClick={() => setActiveVideoTab('demo')}
                  >
                    Demo
                  </button>
                  <button
                    className={`${styles.videoTab} ${activeVideoTab === 'tutorial' ? styles.active : ''}`}
                    onClick={() => setActiveVideoTab('tutorial')}
                  >
                    Tutorial
                  </button>
                  <button
                    className={`${styles.videoTab} ${activeVideoTab === 'showcase' ? styles.active : ''}`}
                    onClick={() => setActiveVideoTab('showcase')}
                  >
                    Showcase
                  </button>
                </div>
                <div className={styles.videoInfo}>
                  <span className={styles.videoDuration}>{currentVideoData.duration}</span>
                  <span className={styles.videoQuality}>4K</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.videoFeaturesGrid}>
            {videoFeatures.map((feature, index) => (
              <div
                key={index}
                className={`${styles.videoFeatureCard} ${feature.locked ? styles.locked : ''}`}
              >
                <div className={styles.videoFeatureIcon}>{feature.icon}</div>
                <h3 className={styles.videoFeatureTitle}>{feature.title}</h3>
                <p className={styles.videoFeatureDesc}>{feature.description}</p>
                {feature.locked && (
                  <span className={styles.lockedBadge}>🔒 Coming Soon</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>
            Ready to <span className={styles.highlight}>Transform?</span>
          </h2>
          <p className={styles.ctaSubtitle}>
            Start creating stunning car visuals in seconds. No design skills required.
          </p>
          <a href="/design-preview" className={styles.ctaBtn}>
            Start Creating Free
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
