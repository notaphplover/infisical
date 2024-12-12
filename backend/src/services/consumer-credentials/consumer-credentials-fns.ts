import { BadRequestError, InternalServerError } from "@app/lib/errors";

import { TDecryptWithKeyDTO, TEncryptWithKmsDTO } from "../kms/kms-types";
import { TConsumerCredentialsDALFactory, TConsumerCredentialsUpdateByIdQuery } from "./consumer-credentials-dal";
import { ConsumerCredentialsDTO, TUpdateOrgUserConsumerCredentialsDTO } from "./consumer-credentials-types";

type ArrayElement<TArray extends readonly unknown[]> = TArray extends readonly (infer ElementType)[]
  ? ElementType
  : never;

type CreditCardConsumerCredentialsInsertItemDb = Awaited<
  ReturnType<TConsumerCredentialsDALFactory["insertCreditCardConsumerCredentials"]>
>;

type WebLoginConsumerCredentialsInsertItemDb = Awaited<
  ReturnType<TConsumerCredentialsDALFactory["insertWebLoginConsumerCredentials"]>
>;

type ConsumerCredentialsUpdateItemDb = Awaited<
  ReturnType<TConsumerCredentialsDALFactory["updateConsumerCredentialsById"]>
>;

type ConsumerCredentialsListItemDb = ArrayElement<Awaited<ReturnType<TConsumerCredentialsDALFactory["list"]>>>;

export function buildCreditCardConsumerCredentialsDTOFromInsertDb(
  consumerCredentialsInsertDb: CreditCardConsumerCredentialsInsertItemDb,
  decryptor: ({ cipherTextBlob }: Pick<TDecryptWithKeyDTO, "cipherTextBlob">) => Buffer
): ConsumerCredentialsDTO {
  return {
    cardNumber: decryptor({
      cipherTextBlob: Buffer.from(consumerCredentialsInsertDb.creditCard.encryptedCardNumber, "hex")
    }).toString(),
    cvv: decryptor({
      cipherTextBlob: Buffer.from(consumerCredentialsInsertDb.creditCard.encryptedCvv, "hex")
    }).toString(),
    expiryDate: consumerCredentialsInsertDb.creditCard.expiryDate,
    id: consumerCredentialsInsertDb.id,
    type: "creditCard"
  };
}

export function buildWebLoginConsumerCredentialsDTOFromInsertDb(
  consumerCredentialsInsertDb: WebLoginConsumerCredentialsInsertItemDb,
  decryptor: ({ cipherTextBlob }: Pick<TDecryptWithKeyDTO, "cipherTextBlob">) => Buffer
): ConsumerCredentialsDTO {
  return {
    id: consumerCredentialsInsertDb.id,
    password: decryptor({
      cipherTextBlob: Buffer.from(consumerCredentialsInsertDb.webLogin.encryptedPassword, "hex")
    }).toString(),
    username: consumerCredentialsInsertDb.webLogin.username,
    type: "webLogin"
  };
}

export function buildConsumerCredentialsDTOFromListItemDb(
  consumerCredentialsListItemDb: ConsumerCredentialsListItemDb,
  decryptor: ({ cipherTextBlob }: Pick<TDecryptWithKeyDTO, "cipherTextBlob">) => Buffer
): ConsumerCredentialsDTO {
  const [creditCard] = consumerCredentialsListItemDb.creditCard;

  if (creditCard) {
    return {
      cardNumber: decryptor({
        cipherTextBlob: Buffer.from(creditCard.encryptedCardNumber, "hex")
      }).toString(),
      cvv: decryptor({
        cipherTextBlob: Buffer.from(creditCard.encryptedCvv, "hex")
      }).toString(),
      expiryDate: creditCard.expiryDate,
      id: consumerCredentialsListItemDb.id,
      type: "creditCard"
    };
  }

  const [webLogin] = consumerCredentialsListItemDb.webLogin;

  if (webLogin) {
    return {
      id: consumerCredentialsListItemDb.id,
      password: decryptor({
        cipherTextBlob: Buffer.from(webLogin.encryptedPassword, "hex")
      }).toString(),
      username: webLogin.username,
      type: "webLogin"
    };
  }

  throw new InternalServerError({
    message: `Unable to fetch consumer credential "${consumerCredentialsListItemDb.id}"`
  });
}

export function buildConsumerCredentialsDTOFromUpdateDb(
  consumerCredentialsUpdateDb: ConsumerCredentialsUpdateItemDb,
  decryptor: ({ cipherTextBlob }: Pick<TDecryptWithKeyDTO, "cipherTextBlob">) => Buffer
): ConsumerCredentialsDTO {
  switch (consumerCredentialsUpdateDb.type) {
    case "creditCard":
      return {
        cardNumber: decryptor({
          cipherTextBlob: Buffer.from(consumerCredentialsUpdateDb.creditCard.encryptedCardNumber, "hex")
        }).toString(),
        cvv: decryptor({
          cipherTextBlob: Buffer.from(consumerCredentialsUpdateDb.creditCard.encryptedCvv, "hex")
        }).toString(),
        expiryDate: consumerCredentialsUpdateDb.creditCard.expiryDate,
        id: consumerCredentialsUpdateDb.id,
        type: "creditCard"
      };
    case "webLogin":
      return {
        id: consumerCredentialsUpdateDb.id,
        password: decryptor({
          cipherTextBlob: Buffer.from(consumerCredentialsUpdateDb.webLogin.encryptedPassword, "hex")
        }).toString(),
        username: consumerCredentialsUpdateDb.webLogin.username,
        type: "webLogin"
      };
    default:
      throw new BadRequestError({
        message: `Invalid "${
          (consumerCredentialsUpdateDb as ConsumerCredentialsUpdateItemDb).type
        }" consumer credentials update query type`
      });
  }
}

export function buildUpdateByIdDbQuery(
  updateQuery: TUpdateOrgUserConsumerCredentialsDTO,
  encryptor: ({ plainText }: Pick<TEncryptWithKmsDTO, "plainText">) => {
    cipherTextBlob: Buffer;
  }
): TConsumerCredentialsUpdateByIdQuery {
  switch (updateQuery.type) {
    case "creditCard": {
      const { cardNumber, cvv, id, expiryDate } = updateQuery;

      const encryptedCardNumber = encryptor({
        plainText: Buffer.from(cardNumber)
      }).cipherTextBlob.toString("hex");

      const encryptedCvv = encryptor({
        plainText: Buffer.from(cvv)
      }).cipherTextBlob.toString("hex");

      return {
        id,
        setQuery: {
          encryptedCardNumber,
          encryptedCvv,
          expiryDate
        },
        type: "creditCard"
      };
    }
    case "webLogin": {
      const { id, password, username } = updateQuery;

      const encryptedPassword = encryptor({
        plainText: Buffer.from(password)
      }).cipherTextBlob.toString("hex");

      return {
        id,
        setQuery: {
          encryptedPassword,
          username
        },
        type: "webLogin"
      };
    }
    default:
      throw new BadRequestError({
        message: `Invalid "${
          (updateQuery as TUpdateOrgUserConsumerCredentialsDTO).type
        }" consumer credentials update query type`
      });
  }
}
