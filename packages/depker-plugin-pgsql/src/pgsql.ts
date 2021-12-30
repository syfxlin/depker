import { PluginCtx } from "@syfxlin/depker-server";
import { PgsqlPluginConfig } from "./index";
import { Client } from "pg";
import { randomUUID } from "crypto";

// prettier-ignore
export const create = async (name: string, ctx: PluginCtx) => {
  const config = ctx.config.pgsql as PgsqlPluginConfig;
  if (!config) {
    return false;
  }

  const secret = `PGSQL_${name}_PASSWORD`.toUpperCase();
  const collection = ctx.database.getCollection("secrets");

  const password = collection
    // find old password
    .findOne({ name: secret })?.value
    // if not found, create new password
    ?? randomUUID().replaceAll("-", "");

  const client = new Client({
    host: config.name,
    user: "postgres",
    password: config.password
  });
  await client.connect();
  try {
    await client.query(`
      DO
      $do$
      BEGIN
        IF NOT exists(SELECT FROM pg_catalog.pg_user WHERE usename = '${name}') THEN
          CREATE USER ${name} WITH PASSWORD '${password}';
        END IF;
      END
      $do$
    `);
    const result = await client.query(`SELECT exists(SELECT FROM pg_catalog.pg_database WHERE datname = '${name}');`);
    if (!result.rows[0].exists) {
      await client.query(`CREATE DATABASE ${name};`);
    }
    await client.query(`GRANT ALL ON DATABASE ${name} TO ${name};`)
  } finally {
    await client.end();
  }

  // store password
  if (!collection.findOne({ name: secret })) {
    collection.insert({
      name: secret,
      value: password,
    });
  }

  return {
    username: name,
    password: password,
    database: name,
  }
};

// prettier-ignore
export const remove = async (name: string, ctx: PluginCtx) => {
  const config = ctx.config.pgsql as PgsqlPluginConfig;
  if (!config) {
    return false;
  }

  const client = new Client({
    host: config.name,
    user: "postgres",
    password: config.password
  });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS ${name};`);
    await client.query(`DROP USER IF EXISTS ${name};`);
  } finally {
    await client.end();
  }

  // remove pgsql password from secret
  const collection = ctx.database.getCollection("secrets");
  const secret = collection.findOne({
    name: `PGSQL_${name}_PASSWORD`.toUpperCase(),
  });
  if (secret) {
    collection.remove(secret);
  }
  return true;
}

// prettier-ignore
export const list = async (ctx: PluginCtx) => {
  const config = ctx.config.pgsql as PgsqlPluginConfig;
  if (!config) {
    return false;
  }
  const client = new Client({
    user: "postgres",
    password: "123456",
  });
  await client.connect();
  try {
    const result = await client.query(`SELECT datname FROM pg_database;`);
    return result.rows
      .map((r) => r.datname)
      .filter((db) => !["postgres", "template0", "template1"].includes(db)) as string[];
  } finally {
    await client.end();
  }
};
