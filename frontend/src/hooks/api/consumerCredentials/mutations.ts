import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { consumerCredentialsKeys } from "./queries";
import {
  TCreateConsumerCredentials,
  TDeleteConsumerCredentials,
  TUpdateConsumerCredentials
} from "./types";

export const useCreateConsumerCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: TCreateConsumerCredentials) => {
      const { data } = await apiRequest.post("/api/v1/consumer-credentials", body);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(consumerCredentialsKeys.get({}));
    }
  });
};

export const useDeleteConsumerCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: TDeleteConsumerCredentials) => {
      const { data } = await apiRequest.delete(`/api/v1/consumer-credentials/${id}`);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(consumerCredentialsKeys.get({}));
    }
  });
};

export const useUpdateConsumerCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: TUpdateConsumerCredentials) => {
      const { data } = await apiRequest.put(`/api/v1/consumer-credentials/${id}`, body);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(consumerCredentialsKeys.get({}));
    }
  });
};
