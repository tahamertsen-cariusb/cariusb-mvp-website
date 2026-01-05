import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import OnboardingClient from './OnboardingClient';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const nextParam = typeof searchParams?.next === 'string' ? searchParams.next : '/dashboard';
  const nextPath = nextParam.startsWith('/') && !nextParam.startsWith('/onboarding')
    ? nextParam
    : '/dashboard';

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, display_name')
    .eq('id', user.id)
    .maybeSingle();

  const fullName = (profile as any)?.full_name || (user.user_metadata as any)?.full_name || '';
  const communityName = (profile as any)?.display_name || '';
  const isComplete = Boolean(profile && ((profile as any)?.full_name || (profile as any)?.display_name));

  if (isComplete) {
    redirect(nextPath);
  }

  return (
    <OnboardingClient
      userId={user.id}
      userEmail={user.email || ''}
      initialFullName={fullName}
      initialCommunityName={communityName}
      nextPath={nextPath}
    />
  );
}

