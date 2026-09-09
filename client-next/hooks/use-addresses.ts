import { useQuery } from "@tanstack/react-query";
import { addressService } from "@/services/address.service";

export const ADDRESSES_QUERY_KEY = ["addresses", "me"] as const;

export function useMyAddresses() {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: () => addressService.getMyAddresses(),
    retry: false,
  });
}
