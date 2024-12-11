import { ForbiddenError } from "@casl/ability";

import { OrgPermissionActions, OrgPermissionSubjects } from "@app/ee/services/permission/org-permission";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service";
import { InternalServerError } from "@app/lib/errors";

import { TKmsServiceFactory } from "../kms/kms-service";
import { KmsDataKey } from "../kms/kms-types";
import { TConsumerCredentialsDALFactory } from "./consumer-credentials-dal";
import {
  buildConsumerCredentialsDTOFromListItemDb,
  buildCreditCardConsumerCredentialsDTOFromInsertDb,
  buildWebLoginConsumerCredentialsDTOFromInsertDb
} from "./consumer-credentials-fns";
import {
  ConsumerCredentialsDTO,
  TFindOrgUserConsumerCredentialsDTO,
  TInsertOrgUserConsumerCredentialsDTO
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
  /*
   * List consumer credentials
   * */
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
        }).cipherTextBlob.toString();

        decryptor({
          cipherTextBlob: Buffer.from(encryptedCardNumber)
        }).toString();

        const encryptedCvv = encryptor({
          plainText: Buffer.from(cvv)
        }).cipherTextBlob.toString();

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
        }).cipherTextBlob.toString();

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

  return {
    insertConsumerCredentials,
    listConsumerCredentials
  };
};
