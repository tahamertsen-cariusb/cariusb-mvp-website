import CommunityClient, { type CommunityPostRow } from './CommunityClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const supabase = createSupabaseServerClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('id, user_id, image_url, tags, likes_count, user_community_name, created_at')
    .order('created_at', { ascending: false })
    .limit(80);

  const userIds = Array.from(
    new Set((posts || []).map((post) => (post as any)?.user_id).filter(Boolean))
  ) as string[];

  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from('profiles').select('id, avatar_url').in('id', userIds)
      : { data: [] as Array<{ id: string; avatar_url: string | null }> };

  const avatarByUserId = new Map<string, string | null>();
  (profiles || []).forEach((row) => avatarByUserId.set(row.id, row.avatar_url));

  const hydratedPosts = (posts || []).map((post: any) => ({
    ...post,
    avatar_url: avatarByUserId.get(post.user_id) || null,
  }));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewer: { id: string; communityName: string; avatarUrl: string | null } | null = null;
  let viewerPosts: CommunityPostRow[] = [];

  if (user) {
    const [{ data: viewerProfile }, { data: viewerPostsRaw }] = await Promise.all([
      supabase.from('profiles').select('id, avatar_url, display_name, full_name').eq('id', user.id).maybeSingle(),
      supabase
        .from('posts')
        .select('id, user_id, image_url, tags, likes_count, user_community_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(120),
    ]);

    const avatarUrl = (viewerProfile as any)?.avatar_url || null;
    const preferredName =
      (viewerPostsRaw as any)?.[0]?.user_community_name ||
      (viewerProfile as any)?.display_name ||
      (viewerProfile as any)?.full_name ||
      'Anonymous';

    viewer = { id: user.id, communityName: preferredName, avatarUrl };
    viewerPosts = ((viewerPostsRaw as any) || []).map((post: any) => ({
      ...post,
      avatar_url: avatarUrl,
    }));
  }

  return (
    <CommunityClient
      initialPosts={(hydratedPosts as CommunityPostRow[]) || []}
      viewer={viewer}
      viewerPosts={viewerPosts}
    />
  );
}
