import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { QuickUploadSection } from '@/components/sections/QuickUploadSection';
import { WowShowcase } from '@/components/sections/WowShowcase';
import { GallerySection } from '@/components/sections/GallerySection';
import { UseCasesSection } from '@/components/sections/UseCasesSection';
import { PricingTeaser } from '@/components/sections/PricingTeaser';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from './page.module.css';

export const revalidate = 60;

export default async function Home() {
  const supabase = createSupabaseServerClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('id, image_url, tags, user_community_name, created_at')
    .order('created_at', { ascending: false })
    .limit(12);

  return (
    <>
      <Navbar />
      <div className={styles.mainContent}>
        <HeroSection />
        <QuickUploadSection />
        <WowShowcase />
        <GallerySection posts={posts || []} />
        <UseCasesSection />
        <PricingTeaser />
        <FinalCTA />
      </div>
      <Footer />
    </>
  );
}

