import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, display_name')
    .eq('id', user.id)
    .maybeSingle();

  const hasAnyName = Boolean((profile as any)?.full_name || (profile as any)?.display_name);
  if (!hasAnyName) {
    redirect('/onboarding?next=/dashboard');
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, project_id, title, thumbnail_url, type, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <DashboardClient
      initialProjects={projects || []}
      userId={user.id}
      userEmail={user.email || ''}
    />
  );
}
