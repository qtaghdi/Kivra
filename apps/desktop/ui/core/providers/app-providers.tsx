import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { supabase } from "@/core/supabase/supabase-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000
    }
  }
});

type appProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: appProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBridge />
      {children}
    </QueryClientProvider>
  );
}

function AuthSessionBridge() {
  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
