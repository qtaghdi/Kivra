import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentUser,
  signInWithGithub,
  signOut
} from "@/features/auth/services/auth-service";

export const useAuthUser = () =>
  useQuery({
    queryKey: ["auth-user"],
    queryFn: getCurrentUser
  });

export const useGithubLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signInWithGithub,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    }
  });
};
