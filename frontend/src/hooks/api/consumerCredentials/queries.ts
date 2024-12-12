import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { TGetConsumerCredentialsDTO, TOrgConsumerCredentialsList } from "./types";

export const consumerCredentialsKeys = {
  all: ["consumer-credentials"] as const,
  lists: () => [...consumerCredentialsKeys.all, "list"] as const,
  get: ({ ...filters }: TGetConsumerCredentialsDTO) =>
    [...consumerCredentialsKeys.lists(), filters] as const
};

export const useGetConsumerCredentials = (
  { offset = 0, limit = 100, type }: TGetConsumerCredentialsDTO,
  options?: Omit<
    UseQueryOptions<
      TOrgConsumerCredentialsList,
      unknown,
      TOrgConsumerCredentialsList,
      ReturnType<typeof consumerCredentialsKeys.get>
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: consumerCredentialsKeys.get({
      offset,
      limit,
      type
    }),
    queryFn: async () => {
      const { data } = await apiRequest.get<TOrgConsumerCredentialsList>(
        "/api/v1/consumer-credentials",
        {
          params: { offset, limit, type }
        }
      );

      return data;
    },
    enabled: options?.enabled ?? true,
    keepPreviousData: true,
    ...options
  });
};
