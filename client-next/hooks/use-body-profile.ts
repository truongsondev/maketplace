"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bodyProfileService } from "@/services/body-profile.service";
import { useAuthStore } from "@/stores/auth.store";
import type { UpdateBodyProfilePayload } from "@/types/body-profile.types";

export const BODY_PROFILE_QUERY_KEY = ["body-profile", "me"] as const;

export function useBodyProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: BODY_PROFILE_QUERY_KEY,
    queryFn: () => bodyProfileService.getMine(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useUpdateBodyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBodyProfilePayload) =>
      bodyProfileService.updateMine(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(BODY_PROFILE_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}
