export interface TGetConsumerCredentialsDTO {
  limit?: number;
  offset?: number;
  type?: "creditCard" | "webLogin";
}

export interface TOrgConsumerCredentialsList {
  keys: TConsumerCredentials[];
}

export interface TBaseConsumerCredentials {
  id: string;
}

export interface TCreditCardConsumerCredentials extends TBaseConsumerCredentials {
  cardNumber: string;
  cvv: string;
  expiryDate: Date;
  type: "creditCard";
}

export interface TWebLoginConsumerCredentials extends TBaseConsumerCredentials {
  username: string;
  password: string;
  type: "webLogin";
}

export type TConsumerCredentials = TCreditCardConsumerCredentials | TWebLoginConsumerCredentials;

type IdRef = { id: string };

export interface TCreateCreditCardConsumerCredentials {
  cardNumber: string;
  cvv: string;
  expiryDate: Date;
  type: "creditCard";
}

export interface TCreateWebLoginConsumerCredentials {
  username: string;
  password: string;
  type: "webLogin";
}

export type TCreateConsumerCredentials =
  | TCreateCreditCardConsumerCredentials
  | TCreateWebLoginConsumerCredentials;
export type TUpdateConsumerCredentials = IdRef & TConsumerCredentials;
export type TDeleteConsumerCredentials = IdRef;
