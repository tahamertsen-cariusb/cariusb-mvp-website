import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DesignPreviewClient from './DesignPreviewClient';

export const dynamic = 'force-dynamic';

export default async function DesignPreviewPage({
  searchParams,
}: {
  searchParams: { project?: string; mode?: string };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const projectParam = searchParams?.project;
  const initialProject = projectParam
    ? await supabase
        .from('projects')
        .select('id, title, thumbnail_url, type, created_at, updated_at')
        .eq('id', projectParam)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => data)
    : await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: 'Untitled Project',
          type: 'photo',
        })
        .select('id, title, thumbnail_url, type, created_at, updated_at')
        .single()
        .then(({ data }) => data);

  const { data: creditsRows } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', user.id);

  const initialCredits = (creditsRows || []).reduce(
    (total, row) => total + (row.amount || 0),
    0
  );

  const initialAssets = initialProject
    ? await supabase
        .from('assets')
        .select('id, url, role, type, created_at')
        .eq('user_id', user.id)
        .eq('project_id', initialProject.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => data || [])
    : [];

  const hasVideoAsset = initialAssets.some((asset) => asset.type === 'video');
  const initialMode =
    searchParams?.mode === 'video' || (initialProject as any)?.type === 'video' || hasVideoAsset
      ? 'video'
      : 'photo';

  return (
    <DesignPreviewClient
      initialUser={{
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata || {},
      }}
      initialCredits={initialCredits}
      initialProject={initialProject ?? undefined}
      initialAssets={initialAssets}
      initialMode={initialMode}
    />
  );
}
