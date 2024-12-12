import { ActorAuthMethod } from "../auth/auth-type";

export interface CreditCardConsumerCredentialsDTO {
  id: string;
  cardNumber: string;
  cvv: string;
  expiryDate: Date;
  type: "creditCard";
}

export interface WebLoginConsumerCredentialsDTO {
  id: string;
  username: string;
  password: string;
  type: "webLogin";
}

export type ConsumerCredentialsDTO = CreditCardConsumerCredentialsDTO | WebLoginConsumerCredentialsDTO;

export interface TFindOrgUserConsumerCredentialsDTO {
  actorAuthMethod: ActorAuthMethod;
  actorOrgId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

export interface TDeleteOrgUserConsumerCredentialsDTO {
  actorAuthMethod: ActorAuthMethod;
  actorOrgId: string;
  id: string;
  userId: string;
}

export interface TBaseInsertOrgUserConsumerCredentialsDTO {
  actorAuthMethod: ActorAuthMethod;
  actorOrgId: string;
  userId: string;
}

export interface TInsertOrgUserCreditCardConsumerCredentialsDTO extends TBaseInsertOrgUserConsumerCredentialsDTO {
  cardNumber: string;
  cvv: string;
  expiryDate: Date;
  type: "creditCard";
}

export interface TInsertOrgUserWebLoginConsumerCredentialsDTO extends TBaseInsertOrgUserConsumerCredentialsDTO {
  username: string;
  password: string;
  type: "webLogin";
}

export type TInsertOrgUserConsumerCredentialsDTO =
  | TInsertOrgUserCreditCardConsumerCredentialsDTO
  | TInsertOrgUserWebLoginConsumerCredentialsDTO;

export interface TBaseUpdateOrgUserConsumerCredentialsDTO {
  actorAuthMethod: ActorAuthMethod;
  actorOrgId: string;
  id: string;
  userId: string;
}

export interface TUpdateOrgUserCreditCardConsumerCredentialsDTO extends TBaseUpdateOrgUserConsumerCredentialsDTO {
  cardNumber: string;
  cvv: string;
  expiryDate: Date;
  type: "creditCard";
}

export interface TUpdateOrgUserWebLoginConsumerCredentialsDTO extends TBaseUpdateOrgUserConsumerCredentialsDTO {
  username: string;
  password: string;
  type: "webLogin";
}

export type TUpdateOrgUserConsumerCredentialsDTO =
  | TUpdateOrgUserCreditCardConsumerCredentialsDTO
  | TUpdateOrgUserWebLoginConsumerCredentialsDTO;
