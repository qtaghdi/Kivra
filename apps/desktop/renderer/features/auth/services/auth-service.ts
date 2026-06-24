import type { User } from "@supabase/supabase-js";

import { supabase } from "@/core/supabase/supabase-client";
import { syncUserProfile } from "@/core/supabase/sync-service";
import { invokeCommand, isTauriRuntime } from "@/core/tauri/tauri-client";

const loopbackAuthCallbackUrl = "http://127.0.0.1:3000/auth/callback";

export type authUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

export const getCurrentUser = async (): Promise<authUser | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  const sessionUser = data.session?.user;

  if (error || !sessionUser) {
    return null;
  }

  const user = buildAuthUser(sessionUser);

  void syncUserProfile({
    id: user.id,
    githubId: getGithubUserId(sessionUser),
    username: user.username,
    avatarUrl: user.avatarUrl
  });

  return user;
};

export const signInWithGithub = async (): Promise<authUser | null> => {
  if (!supabase) {
    throw new Error("SUPABASE_CONFIG_REQUIRED");
  }

  if (!isTauriRuntime()) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/login`
      }
    });

    if (error) {
      throw error;
    }

    return null;
  }

  const callbackUrlPromise = invokeCommand<string>("wait_for_auth_callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: loopbackAuthCallbackUrl,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("GITHUB_OAUTH_URL_MISSING");
  }

  await invokeCommand("open_external_url", { url: data.url });
  const callbackUrl = await callbackUrlPromise;

  return handleAuthCallbackUrl(callbackUrl);
};

export const handleAuthCallbackUrl = async (url: string): Promise<authUser | null> => {
  if (!supabase) {
    return null;
  }

  const callbackUrl = parseAuthCallbackUrl(url);

  if (!callbackUrl) {
    return null;
  }

  const error = callbackUrl.searchParams.get("error_description");

  if (error) {
    throw new Error(error);
  }

  const code = callbackUrl.searchParams.get("code");

  if (!code) {
    return null;
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    throw exchangeError;
  }

  return getCurrentUser();
};

export const getGithubAccessToken = async (): Promise<string | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.provider_token) {
    return null;
  }

  return data.session.provider_token;
};

export const signOut = async () => {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
};

const parseAuthCallbackUrl = (url: string) => {
  try {
    const callbackUrl = new URL(url);
    const loopbackCallbackUrl = new URL(loopbackAuthCallbackUrl);
    const isAuthCallback =
      (callbackUrl.protocol === "kivra:" &&
        callbackUrl.hostname === "auth" &&
        callbackUrl.pathname === "/callback") ||
      (callbackUrl.origin === loopbackCallbackUrl.origin &&
        callbackUrl.pathname === loopbackCallbackUrl.pathname);

    return isAuthCallback ? callbackUrl : null;
  } catch {
    return null;
  }
};

const buildAuthUser = (user: User): authUser => ({
  id: user.id,
  username:
    user.user_metadata.user_name ??
    user.user_metadata.preferred_username ??
    user.email ??
    "GitHub User",
  avatarUrl: user.user_metadata.avatar_url ?? null
});

const getGithubUserId = (user: User) => {
  return user.user_metadata.provider_id ?? user.user_metadata.sub ?? user.id;
};
