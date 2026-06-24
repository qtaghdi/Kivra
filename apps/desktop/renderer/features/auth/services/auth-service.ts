import type { Session, User } from "@supabase/supabase-js";

import { getAppEnv } from "@/core/config/env";
import { supabase } from "@/core/supabase/supabase-client";
import { syncUserProfile } from "@/core/supabase/sync-service";
import { invokeCommand, isTauriRuntime } from "@/core/tauri/tauri-client";

const loopbackAuthCallbackUrl = "http://localhost:3000";

type nativeAuthSession = {
  access_token: string;
  expires_at?: number;
  expires_in?: number;
  provider_refresh_token?: string;
  provider_token?: string;
  refresh_token: string;
  token_type?: string;
  user: User;
};

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

  if (isTauriRuntime()) {
    return exchangeDesktopAuthCode(code);
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
    const isAuthCallback =
      (callbackUrl.protocol === "kivra:" &&
        callbackUrl.hostname === "auth" &&
        callbackUrl.pathname === "/callback") ||
      callbackUrl.origin === loopbackAuthCallbackUrl;

    return isAuthCallback ? callbackUrl : null;
  } catch {
    return null;
  }
};

const exchangeDesktopAuthCode = async (code: string): Promise<authUser> => {
  if (!supabase) {
    throw new Error("SUPABASE_CONFIG_REQUIRED");
  }

  const env = getAppEnv();
  const authStorageKey = getAuthStorageKey(env.supabaseUrl);
  const verifierStorageKey = `${authStorageKey}-code-verifier`;
  const verifier = readCodeVerifier(verifierStorageKey);

  if (!verifier) {
    throw new Error("GITHUB_OAUTH_CODE_VERIFIER_MISSING");
  }

  const session = await invokeCommand<nativeAuthSession>("exchange_auth_code", {
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
    code,
    codeVerifier: verifier.value
  });

  persistDesktopSession(authStorageKey, session);
  localStorage.removeItem(verifier.key);

  const user = buildAuthUser(session.user);

  void syncUserProfile({
    id: user.id,
    githubId: getGithubUserId(session.user),
    username: user.username,
    avatarUrl: user.avatarUrl
  });

  return user;
};

const getAuthStorageKey = (supabaseUrl: string) => {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

  return `sb-${projectRef}-auth-token`;
};

const persistDesktopSession = (storageKey: string, session: nativeAuthSession) => {
  const currentTime = Math.round(Date.now() / 1000);
  const expiresIn = session.expires_in ?? 3600;
  const expiresAt =
    session.expires_at ??
    currentTime + expiresIn;
  const storedSession: Session = {
    ...session,
    expires_at: expiresAt,
    expires_in: expiresIn,
    token_type: "bearer"
  };

  localStorage.setItem(storageKey, JSON.stringify(storedSession));
};

const readCodeVerifier = (preferredKey: string) => {
  const preferredValue = localStorage.getItem(preferredKey);

  if (preferredValue) {
    return {
      key: preferredKey,
      value: preferredValue.split("/")[0]
    };
  }

  const fallbackKey = Object.keys(localStorage).find((key) => {
    return key.endsWith("-code-verifier") && Boolean(localStorage.getItem(key));
  });

  if (!fallbackKey) {
    return null;
  }

  const fallbackValue = localStorage.getItem(fallbackKey)?.split("/")[0];

  if (!fallbackValue) {
    return null;
  }

  return {
    key: fallbackKey,
    value: fallbackValue
  };
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
