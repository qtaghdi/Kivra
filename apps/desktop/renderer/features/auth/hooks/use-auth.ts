import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type authUser,
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
    onSuccess: async (user) => {
      queryClient.setQueryData<authUser | null>(["auth-user"], user);
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
