import { supabase } from "@/core/supabase/supabase-client";
import { syncUserProfile } from "@/core/supabase/sync-service";

export type authUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

export async function getCurrentUser(): Promise<authUser | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const user = {
    id: data.user.id,
    username:
      data.user.user_metadata.user_name ??
      data.user.user_metadata.preferred_username ??
      data.user.email ??
      "GitHub User",
    avatarUrl: data.user.user_metadata.avatar_url ?? null
  };

  await syncUserProfile({
    id: user.id,
    githubId:
      data.user.user_metadata.provider_id ??
      data.user.user_metadata.sub ??
      data.user.id,
    username: user.username,
    avatarUrl: user.avatarUrl
  });

  return user;
}

export async function signInWithGithub() {
  if (!supabase) {
    throw new Error("SUPABASE_CONFIG_REQUIRED");
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}
