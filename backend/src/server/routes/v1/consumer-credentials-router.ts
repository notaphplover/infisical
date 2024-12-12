import { z } from "zod";

import { CONSUMER_CREDENTIALS } from "@app/lib/api-docs";
import { readLimit, writeLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";
import {
  validateCardNumberField,
  validateCvvField
} from "@app/services/consumer-credentials/consumer-credentials-validators";

export const registerConsumerCredentialsRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "DELETE",
    url: "/consumer-credentials/:consumerCredentialsId",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      params: z.object({
        consumerCredentialsId: z.string().trim()
      })
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      await server.services.consumerCredentials.deleteConsumerCredentials({
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        id: req.params.consumerCredentialsId,
        userId: req.permission.id
      });
    }
  });

  server.route({
    method: "GET",
    url: "/consumer-credentials",
    config: {
      rateLimit: readLimit
    },
    schema: {
      querystring: z.object({
        offset: z.coerce.number().min(0).optional().default(0).describe(CONSUMER_CREDENTIALS.LIST.offset),
        limit: z.coerce.number().min(1).max(100).optional().default(100).describe(CONSUMER_CREDENTIALS.LIST.limit)
      }),
      response: {
        200: z.object({
          consumerCredentials: z
            .discriminatedUnion("type", [
              z.object({
                cardNumber: z.string(),
                cvv: z.string(),
                expiryDate: z.date(),
                id: z.string(),
                type: z.literal("creditCard")
              }),
              z.object({
                id: z.string(),
                username: z.string(),
                password: z.string(),
                type: z.literal("webLogin")
              })
            ])
            .array()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const consumerCredentials = await server.services.consumerCredentials.listConsumerCredentials({
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        userId: req.permission.id,
        limit: req.query.limit,
        offset: req.query.offset
      });

      return { consumerCredentials };
    }
  });

  server.route({
    method: "POST",
    url: "/consumer-credentials",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      body: z.discriminatedUnion("type", [
        z.object({
          cardNumber: validateCardNumberField,
          cvv: validateCvvField,
          expiryDate: z
            .string()
            .datetime()
            .transform((arg) => new Date(arg)),
          type: z.literal("creditCard")
        }),
        z.object({
          password: z.string().trim(),
          username: z.string().trim(),
          type: z.literal("webLogin")
        })
      ]),
      response: {
        200: z.discriminatedUnion("type", [
          z.object({
            cardNumber: z.string(),
            cvv: z.string(),
            expiryDate: z.date(),
            type: z.literal("creditCard")
          }),
          z.object({
            username: z.string(),
            password: z.string(),
            type: z.literal("webLogin")
          })
        ])
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const consumerCredentials = await server.services.consumerCredentials.insertConsumerCredentials({
        ...req.body,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        userId: req.permission.id
      });

      return consumerCredentials;
    }
  });

  server.route({
    method: "PUT",
    url: "/consumer-credentials/:consumerCredentialsId",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      params: z.object({
        consumerCredentialsId: z.string().trim()
      }),
      body: z.discriminatedUnion("type", [
        z.object({
          cardNumber: validateCardNumberField,
          cvv: validateCvvField,
          expiryDate: z
            .string()
            .datetime()
            .transform((arg) => new Date(arg)),
          type: z.literal("creditCard")
        }),
        z.object({
          password: z.string().trim(),
          username: z.string().trim(),
          type: z.literal("webLogin")
        })
      ]),
      response: {
        200: z.discriminatedUnion("type", [
          z.object({
            cardNumber: z.string(),
            cvv: z.string(),
            expiryDate: z.date(),
            type: z.literal("creditCard")
          }),
          z.object({
            username: z.string(),
            password: z.string(),
            type: z.literal("webLogin")
          })
        ])
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const consumerCredentials = await server.services.consumerCredentials.updateConsumerCredentialsById({
        ...req.body,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        id: req.params.consumerCredentialsId,
        userId: req.permission.id
      });

      return consumerCredentials;
    }
  });
};
