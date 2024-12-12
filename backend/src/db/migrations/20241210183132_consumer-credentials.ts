import { Knex } from "knex";

import { TableName } from "../schemas";
import { createOnUpdateTrigger, dropOnUpdateTrigger } from "../utils";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(TableName.ConsumerCredentials))) {
    await knex.schema.createTable(TableName.ConsumerCredentials, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.uuid("userId").notNullable();
      t.foreign("userId").references("id").inTable(TableName.Users).onDelete("CASCADE");
      t.uuid("orgId").notNullable();
      t.foreign("orgId").references("id").inTable(TableName.Organization).onDelete("CASCADE");
    });
  }

  if (!(await knex.schema.hasTable(TableName.CreditCardConsumerCredentials))) {
    await knex.schema.createTable(TableName.CreditCardConsumerCredentials, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.text("encryptedCardNumber").notNullable();
      t.text("encryptedCvv").notNullable();
      t.datetime("expiryDate").notNullable();
      t.uuid("consumerCredentialsId").notNullable().unique();
      t.foreign("consumerCredentialsId").references("id").inTable(TableName.ConsumerCredentials).onDelete("CASCADE");
      t.timestamps(true, true, true);
    });
  }

  await createOnUpdateTrigger(knex, TableName.CreditCardConsumerCredentials);

  if (!(await knex.schema.hasTable(TableName.WebLoginConsumerCredentials))) {
    await knex.schema.createTable(TableName.WebLoginConsumerCredentials, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.string("username").notNullable();
      t.text("encryptedPassword").notNullable();
      t.uuid("consumerCredentialsId").notNullable().unique();
      t.foreign("consumerCredentialsId").references("id").inTable(TableName.ConsumerCredentials).onDelete("CASCADE");
      t.timestamps(true, true, true);
    });
  }

  await createOnUpdateTrigger(knex, TableName.WebLoginConsumerCredentials);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TableName.WebLoginConsumerCredentials);
  await dropOnUpdateTrigger(knex, TableName.WebLoginConsumerCredentials);

  await knex.schema.dropTableIfExists(TableName.CreditCardConsumerCredentials);
  await dropOnUpdateTrigger(knex, TableName.CreditCardConsumerCredentials);

  await knex.schema.dropTableIfExists(TableName.ConsumerCredentials);
}
