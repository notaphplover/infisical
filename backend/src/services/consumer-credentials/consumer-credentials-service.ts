import { ForbiddenError } from "@casl/ability";

import { OrgPermissionActions, OrgPermissionSubjects } from "@app/ee/services/permission/org-permission";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service";
import { InternalServerError } from "@app/lib/errors";

import { TKmsServiceFactory } from "../kms/kms-service";
import { KmsDataKey } from "../kms/kms-types";
import { TConsumerCredentialsDALFactory, TConsumerCredentialsUpdateByIdQuery } from "./consumer-credentials-dal";
import {
  buildConsumerCredentialsDTOFromListItemDb,
  buildConsumerCredentialsDTOFromUpdateDb,
  buildCreditCardConsumerCredentialsDTOFromInsertDb,
  buildUpdateByIdDbQuery,
  buildWebLoginConsumerCredentialsDTOFromInsertDb
} from "./consumer-credentials-fns";
import {
  ConsumerCredentialsDTO,
  TDeleteOrgUserConsumerCredentialsDTO,
  TFindOrgUserConsumerCredentialsDTO,
  TInsertOrgUserConsumerCredentialsDTO,
  TUpdateOrgUserConsumerCredentialsDTO
} from "./consumer-credentials-types";

export type TConsumerCredentialsServiceFactory = ReturnType<typeof consumerCredentialsServiceFactory>;

type TConsumerCredentialsServiceFactoryDep = {
  consumerCredentialsDAL: TConsumerCredentialsDALFactory;
  kmsService: TKmsServiceFactory;
  permissionService: TPermissionServiceFactory;
};

export const consumerCredentialsServiceFactory = ({
  consumerCredentialsDAL,
  kmsService,
  permissionService
}: TConsumerCredentialsServiceFactoryDep) => {
  const deleteConsumerCredentials = async (insertQuery: TDeleteOrgUserConsumerCredentialsDTO): Promise<void> => {
    const { actorAuthMethod, actorOrgId, id, userId } = insertQuery;

    const { permission } = await permissionService.getUserOrgPermission(
      userId,
      actorOrgId,
      actorAuthMethod,
      actorOrgId
    );
    ForbiddenError.from(permission).throwUnlessCan(
      OrgPermissionActions.Delete,
      OrgPermissionSubjects.ConsumerCredentials
    );

    await consumerCredentialsDAL.deleteById(id);
  };

  const insertConsumerCredentials = async (
    insertQuery: TInsertOrgUserConsumerCredentialsDTO
  ): Promise<ConsumerCredentialsDTO> => {
    const { actorAuthMethod, actorOrgId, type, userId } = insertQuery;

    const { permission } = await permissionService.getUserOrgPermission(
      userId,
      actorOrgId,
      actorAuthMethod,
      actorOrgId
    );
    ForbiddenError.from(permission).throwUnlessCan(
      OrgPermissionActions.Create,
      OrgPermissionSubjects.ConsumerCredentials
    );

    const { encryptor, decryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.Organization,
      orgId: actorOrgId
    });

    switch (type) {
      case "creditCard": {
        const { cardNumber, cvv, expiryDate } = insertQuery;

        const encryptedCardNumber = encryptor({
          plainText: Buffer.from(cardNumber)
        }).cipherTextBlob.toString("hex");

        const encryptedCvv = encryptor({
          plainText: Buffer.from(cvv)
        }).cipherTextBlob.toString("hex");

        const insertCreditCardConsumerCredentialsResult =
          await consumerCredentialsDAL.insertCreditCardConsumerCredentials({
            consumerCredentialsInsert: {
              orgId: actorOrgId,
              userId
            },
            creditCardConsumerCredentialsInsert: {
              encryptedCardNumber,
              encryptedCvv,
              expiryDate
            }
          });

        return buildCreditCardConsumerCredentialsDTOFromInsertDb(insertCreditCardConsumerCredentialsResult, decryptor);
      }
      case "webLogin": {
        const { password, username } = insertQuery;

        const encryptedPassword = encryptor({
          plainText: Buffer.from(password)
        }).cipherTextBlob.toString("hex");

        const insertWebLoginConsumerCredentialsResult = await consumerCredentialsDAL.insertWebLoginConsumerCredentials({
          consumerCredentialsInsert: {
            orgId: actorOrgId,
            userId
          },
          webLoginConsumerCredentialsInsert: {
            encryptedPassword,
            username
          }
        });

        return buildWebLoginConsumerCredentialsDTOFromInsertDb(insertWebLoginConsumerCredentialsResult, decryptor);
      }

      default:
        throw new InternalServerError({
          message: "Unable to parse insert result consumer credentials"
        });
    }
  };

  const listConsumerCredentials = async ({
    actorAuthMethod,
    actorOrgId,
    userId,
    limit = 20,
    offset = 0
  }: TFindOrgUserConsumerCredentialsDTO): Promise<ConsumerCredentialsDTO[]> => {
    const { permission } = await permissionService.getUserOrgPermission(
      userId,
      actorOrgId,
      actorAuthMethod,
      actorOrgId
    );
    ForbiddenError.from(permission).throwUnlessCan(
      OrgPermissionActions.Read,
      OrgPermissionSubjects.ConsumerCredentials
    );

    const consumerCredentialsList = await consumerCredentialsDAL.list({
      orgId: actorOrgId,
      userId,
      limit,
      offset
    });

    const { decryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.Organization,
      orgId: actorOrgId
    });

    return consumerCredentialsList.map((consumerCredentials) =>
      buildConsumerCredentialsDTOFromListItemDb(consumerCredentials, decryptor)
    );
  };

  const updateConsumerCredentialsById = async (updateQuery: TUpdateOrgUserConsumerCredentialsDTO) => {
    const { actorAuthMethod, actorOrgId, userId } = updateQuery;

    const { permission } = await permissionService.getUserOrgPermission(
      userId,
      actorOrgId,
      actorAuthMethod,
      actorOrgId
    );

    ForbiddenError.from(permission).throwUnlessCan(
      OrgPermissionActions.Edit,
      OrgPermissionSubjects.ConsumerCredentials
    );

    const { encryptor, decryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.Organization,
      orgId: actorOrgId
    });

    const updateByIdDbQuery: TConsumerCredentialsUpdateByIdQuery = buildUpdateByIdDbQuery(updateQuery, encryptor);

    const updatedConsumerCredentials = await consumerCredentialsDAL.updateConsumerCredentialsById(updateByIdDbQuery);

    return buildConsumerCredentialsDTOFromUpdateDb(updatedConsumerCredentials, decryptor);
  };

  return {
    deleteConsumerCredentials,
    insertConsumerCredentials,
    listConsumerCredentials,
    updateConsumerCredentialsById
  };
};
