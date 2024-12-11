import { InternalServerError } from "@app/lib/errors";

import { TDecryptWithKeyDTO } from "../kms/kms-types";
import { TConsumerCredentialsDALFactory } from "./consumer-credentials-dal";
import { ConsumerCredentialsDTO } from "./consumer-credentials-types";

type ArrayElement<TArray extends readonly unknown[]> = TArray extends readonly (infer ElementType)[]
  ? ElementType
  : never;

type CreditCardConsumerCredentialsInsertItemDb = Awaited<
  ReturnType<TConsumerCredentialsDALFactory["insertCreditCardConsumerCredentials"]>
>;

type WebLoginConsumerCredentialsInsertItemDb = Awaited<
  ReturnType<TConsumerCredentialsDALFactory["insertWebLoginConsumerCredentials"]>
>;

type ConsumerCredentialsListItemDb = ArrayElement<Awaited<ReturnType<TConsumerCredentialsDALFactory["list"]>>>;

export function buildCreditCardConsumerCredentialsDTOFromInsertDb(
  consumerCredentialsInsertDb: CreditCardConsumerCredentialsInsertItemDb,
  decryptor: ({ cipherTextBlob }: Pick<TDecryptWithKeyDTO, "cipherTextBlob">) => Buffer
): ConsumerCredentialsDTO {
  return {
    cardNumber: decryptor({
      cipherTextBlob: Buffer.from(consumerCredentialsInsertDb.creditCard.encryptedCardNumber)
    }).toString(),
    cvv: decryptor({
      cipherTextBlob: Buffer.from(consumerCredentialsInsertDb.creditCard.encryptedCvv)
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
      cipherTextBlob: Buffer.from(consumerCredentialsInsertDb.webLogin.encryptedPassword)
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
        cipherTextBlob: Buffer.from(creditCard.encryptedCardNumber)
      }).toString(),
      cvv: decryptor({
        cipherTextBlob: Buffer.from(creditCard.encryptedCvv)
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
        cipherTextBlob: Buffer.from(webLogin.encryptedPassword)
      }).toString(),
      username: webLogin.username,
      type: "webLogin"
    };
  }

  throw new InternalServerError({
    message: `Unable to fetch consumer credential "${consumerCredentialsListItemDb.id}"`
  });
}
