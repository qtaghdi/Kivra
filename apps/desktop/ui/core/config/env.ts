export type appEnv = {
  supabaseAnonKey: string;
  supabaseUrl: string;
};

export function getAppEnv(): appEnv {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? ""
  };
}

export function hasSupabaseConfig() {
  const env = getAppEnv();

  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
