import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentUser,
  signInWithGithub,
  signOut
} from "@/features/auth/services/auth-service";

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: getCurrentUser
  });
}

export function useGithubLogin() {
  return useMutation({
    mutationFn: signInWithGithub
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    }
  });
}
