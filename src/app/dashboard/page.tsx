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

  const projectIds = (projects || []).map((project) => project.id);
  const videoProjectIds =
    projectIds.length > 0
      ? new Set(
          (
            await supabase
              .from('assets')
              .select('project_id')
              .eq('user_id', user.id)
              .eq('type', 'video')
              .in('project_id', projectIds)
              .then(({ data }) => data || [])
          ).map((row) => (row as any).project_id as string)
        )
      : new Set<string>();

  const projectsWithFlags = (projects || []).map((project) => ({
    ...project,
    has_video: videoProjectIds.has(project.id),
  }));

  return (
    <DashboardClient
      initialProjects={projectsWithFlags}
      userId={user.id}
      userEmail={user.email || ''}
    />
  );
}
