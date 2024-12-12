import knex from "knex";

import { TDbClient } from "@app/db";
import {
  ConsumerCredentialsSchema,
  TableName,
  TConsumerCredentialsInsert,
  TCreditCardConsumerCredentialsInsert,
  TCreditCardConsumerCredentialsUpdate,
  TWebLoginConsumerCredentialsInsert,
  TWebLoginConsumerCredentialsUpdate
} from "@app/db/schemas";
import { BadRequestError, DatabaseError, NotFoundError } from "@app/lib/errors";
import { ormify, sqlNestRelationships } from "@app/lib/knex";

export type TConsumerCredentialsDALFactory = ReturnType<typeof consumerCredentialsDALFactory>;

interface TFindQuery {
  orgId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
  type?: "creditCard" | "webLogin";
}

interface TCreditCardConsumerCredentialsUpdateByIdQuery {
  id: string;
  setQuery: TCreditCardConsumerCredentialsUpdate;
  type: "creditCard";
}

interface TWebLoginConsumerCredentialsUpdateByIdQuery {
  id: string;
  setQuery: TWebLoginConsumerCredentialsUpdate;
  type: "webLogin";
}

export type TConsumerCredentialsUpdateByIdQuery =
  | TCreditCardConsumerCredentialsUpdateByIdQuery
  | TWebLoginConsumerCredentialsUpdateByIdQuery;

export const consumerCredentialsDALFactory = (db: TDbClient) => {
  const consumerCredentialsOrm = ormify(db, TableName.ConsumerCredentials);
  const creditCardConsumerCredentialsOrm = ormify(db, TableName.CreditCardConsumerCredentials);
  const webLoginConsumerCredentialsOrm = ormify(db, TableName.WebLoginConsumerCredentials);

  const listQuery = ({ orgId, userId, limit, offset, type }: TFindQuery, tx: knex.Knex) => {
    const consumerCredentialsQuery = tx(TableName.ConsumerCredentials)
      .where((bd) => {
        if (orgId !== undefined) {
          void bd.where(`${TableName.ConsumerCredentials}.orgId`, orgId);
        }
      })
      .where((bd) => {
        if (userId !== undefined) {
          void bd.where(`${TableName.ConsumerCredentials}.userId`, userId);
        }
      });

    const creditCardJoinedQuery =
      type === "creditCard"
        ? consumerCredentialsQuery.innerJoin(
            TableName.CreditCardConsumerCredentials,
            `${TableName.ConsumerCredentials}.id`,
            `${TableName.CreditCardConsumerCredentials}.consumerCredentialsId`
          )
        : consumerCredentialsQuery.leftJoin(
            TableName.CreditCardConsumerCredentials,
            `${TableName.ConsumerCredentials}.id`,
            `${TableName.CreditCardConsumerCredentials}.consumerCredentialsId`
          );

    const webLoginJoinedQuery =
      type === "webLogin"
        ? creditCardJoinedQuery.innerJoin(
            TableName.WebLoginConsumerCredentials,
            `${TableName.ConsumerCredentials}.id`,
            `${TableName.WebLoginConsumerCredentials}.consumerCredentialsId`
          )
        : creditCardJoinedQuery.leftJoin(
            TableName.WebLoginConsumerCredentials,
            `${TableName.ConsumerCredentials}.id`,
            `${TableName.WebLoginConsumerCredentials}.consumerCredentialsId`
          );

    const fieldsSelectedQuery = webLoginJoinedQuery.select(
      db.ref("id").withSchema(TableName.ConsumerCredentials),
      db.ref("userId").withSchema(TableName.ConsumerCredentials),
      db.ref("orgId").withSchema(TableName.ConsumerCredentials),
      db.ref("id").withSchema(TableName.CreditCardConsumerCredentials).as("creditCardId"),
      db
        .ref("encryptedCardNumber")
        .withSchema(TableName.CreditCardConsumerCredentials)
        .as("creditCardEncryptedCardNumber"),
      db.ref("encryptedCvv").withSchema(TableName.CreditCardConsumerCredentials).as("creditCardEncryptedCvv"),
      db.ref("expiryDate").withSchema(TableName.CreditCardConsumerCredentials).as("creditCardExpiryDate"),
      db.ref("id").withSchema(TableName.WebLoginConsumerCredentials).as("webLoginId"),
      db.ref("username").withSchema(TableName.WebLoginConsumerCredentials).as("webLoginUsername"),
      db.ref("encryptedPassword").withSchema(TableName.WebLoginConsumerCredentials).as("webLoginEncryptedPassword")
    );

    if (limit) void fieldsSelectedQuery.limit(limit);
    if (offset) void fieldsSelectedQuery.offset(offset);

    return fieldsSelectedQuery;
  };

  const list = async (findQuery: TFindQuery, tx?: knex.Knex) => {
    try {
      const data = await listQuery(findQuery, tx ?? db.replicaNode());

      return sqlNestRelationships({
        data,
        key: "id",
        parentMapper: (el) => ({
          ...ConsumerCredentialsSchema.parse(el)
        }),
        childrenMapper: [
          {
            key: "creditCardId",
            label: "creditCard" as const,
            mapper: (creditCard) =>
              creditCard.creditCardId
                ? {
                    id: creditCard.creditCardId,
                    encryptedCardNumber: creditCard.creditCardEncryptedCardNumber,
                    encryptedCvv: creditCard.creditCardEncryptedCvv,
                    expiryDate: creditCard.creditCardExpiryDate
                  }
                : null
          },
          {
            key: "webLoginId",
            label: "webLogin" as const,
            mapper: (webLogin) =>
              webLogin.webLoginId
                ? {
                    id: webLogin.webLoginId,
                    encryptedPassword: webLogin.webLoginEncryptedPassword,
                    username: webLogin.webLoginUsername
                  }
                : null
          }
        ]
      });
    } catch (error) {
      throw new DatabaseError({ error, name: "List consumer credentials" });
    }
  };

  const insertCreditCardConsumerCredentials = async (
    insertQuery: {
      consumerCredentialsInsert: TConsumerCredentialsInsert;
      creditCardConsumerCredentialsInsert: Omit<TCreditCardConsumerCredentialsInsert, "consumerCredentialsId">;
    },
    tx?: knex.Knex
  ) => {
    const consumerCredentialsCreateResult = await consumerCredentialsOrm.create(
      insertQuery.consumerCredentialsInsert,
      tx ?? db
    );

    const creditCardConsumerCredentialsCreateResult = await creditCardConsumerCredentialsOrm.create({
      ...insertQuery.creditCardConsumerCredentialsInsert,
      consumerCredentialsId: consumerCredentialsCreateResult.id
    });

    return {
      ...consumerCredentialsCreateResult,
      creditCard: creditCardConsumerCredentialsCreateResult
    };
  };

  const insertWebLoginConsumerCredentials = async (
    insertQuery: {
      consumerCredentialsInsert: TConsumerCredentialsInsert;
      webLoginConsumerCredentialsInsert: Omit<TWebLoginConsumerCredentialsInsert, "consumerCredentialsId">;
    },
    tx?: knex.Knex
  ) => {
    const consumerCredentialsCreateResult = await consumerCredentialsOrm.create(
      insertQuery.consumerCredentialsInsert,
      tx ?? db
    );

    const webLoginConsumerCredentialsCreateResult = await webLoginConsumerCredentialsOrm.create({
      ...insertQuery.webLoginConsumerCredentialsInsert,
      consumerCredentialsId: consumerCredentialsCreateResult.id
    });

    return {
      ...consumerCredentialsCreateResult,
      webLogin: webLoginConsumerCredentialsCreateResult
    };
  };

  const updateCreditCardConsumerCredentialsById = async (
    updateQuery: TCreditCardConsumerCredentialsUpdateByIdQuery,
    tx?: knex.Knex
  ) => {
    const dbOrTx = tx ?? db;

    const creditCardConsumerCredentials = await creditCardConsumerCredentialsOrm.findOne(
      {
        consumerCredentialsId: updateQuery.id
      },
      dbOrTx
    );

    if (creditCardConsumerCredentials === null) {
      throw new NotFoundError({ message: "Consumer credentials not found" });
    }

    const updateResult = await creditCardConsumerCredentialsOrm.updateById(
      creditCardConsumerCredentials.id,
      updateQuery.setQuery
    );

    return {
      id: updateQuery.id,
      creditCard: updateResult,
      type: "creditCard"
    } as const;
  };

  const updateWebLoginConsumerCredentialsById = async (
    updateQuery: TWebLoginConsumerCredentialsUpdateByIdQuery,
    tx?: knex.Knex
  ) => {
    const dbOrTx = tx ?? db;

    const webLoginConsumerCredentials = await webLoginConsumerCredentialsOrm.findOne(
      {
        consumerCredentialsId: updateQuery.id
      },
      dbOrTx
    );

    if (webLoginConsumerCredentials === null) {
      throw new NotFoundError({ message: "Consumer credentials not found" });
    }

    const updateResult = await webLoginConsumerCredentialsOrm.updateById(
      webLoginConsumerCredentials.id,
      updateQuery.setQuery
    );

    return {
      id: updateQuery.id,
      webLogin: updateResult,
      type: "webLogin"
    } as const;
  };

  const updateConsumerCredentialsById = async (updateQuery: TConsumerCredentialsUpdateByIdQuery, tx?: knex.Knex) => {
    switch (updateQuery.type) {
      case "creditCard":
        return updateCreditCardConsumerCredentialsById(updateQuery, tx);
      case "webLogin":
        return updateWebLoginConsumerCredentialsById(updateQuery, tx);
      default:
        throw new BadRequestError({
          message: `Invalid "${
            (updateQuery as TConsumerCredentialsUpdateByIdQuery).type
          }" consumer credentials update query type`
        });
    }
  };

  return {
    deleteById: consumerCredentialsOrm.deleteById,
    insertCreditCardConsumerCredentials,
    insertWebLoginConsumerCredentials,
    list,
    updateConsumerCredentialsById
  };
};
