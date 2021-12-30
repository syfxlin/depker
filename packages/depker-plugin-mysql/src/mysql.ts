import { PluginCtx } from "@syfxlin/depker-server";
import { MysqlPluginConfig } from "./index";
import { createConnection, RowDataPacket } from "mysql2";
import { randomUUID } from "crypto";

// prettier-ignore
export const create = async (name: string, ctx: PluginCtx) => {
  const config = ctx.config.mysql as MysqlPluginConfig;
  if (!config) {
    return false;
  }

  const secret = `MYSQL_${name}_PASSWORD`.toUpperCase();
  const collection = ctx.database.getCollection("secrets");

  const password = collection
    // find old password
    .findOne({ name: secret })?.value
    // if not found, create new password
    ?? randomUUID().replaceAll("-", "");

  const conn = createConnection({
    host: config.name,
    user: "root",
    password: config.password,
  });
  try {
    await conn.promise().query(`CREATE USER IF NOT EXISTS '${name}'@'%' IDENTIFIED BY '${password}'`)
    await conn.promise().query(`FLUSH PRIVILEGES`);
    await conn.promise().query(`CREATE DATABASE IF NOT EXISTS \`${name}\``);
    await conn.promise().query(`GRANT ALL PRIVILEGES ON \`${name}\` . * TO '${name}'@'%'`);
    await conn.promise().query(`FLUSH PRIVILEGES`);
  } finally {
    conn.end()
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
  const config = ctx.config.mysql as MysqlPluginConfig;
  if (!config) {
    return false;
  }

  const conn = createConnection({
    host: config.name,
    user: "root",
    password: config.password,
  });
  try {
    await conn.promise().query(`DROP DATABASE IF EXISTS \`${name}\``);
    await conn.promise().query(`DROP USER IF EXISTS \`${name}\``);
    await conn.promise().query(`FLUSH PRIVILEGES`);
  } finally {
    conn.end();
  }

  // remove mysql password from secret
  const collection = ctx.database.getCollection("secrets");
  const secret = collection.findOne({
    name: `MYSQL_${name}_PASSWORD`.toUpperCase(),
  });
  if (secret) {
    collection.remove(secret);
  }
  return true;
}

// prettier-ignore
export const list = async (ctx: PluginCtx) => {
  const config = ctx.config.mysql as MysqlPluginConfig;
  if (!config) {
    return false;
  }
  const conn = createConnection({
    host: config.name,
    user: "root",
    password: config.password,
  });
  try { 
    const [databases] = await conn.promise().query<RowDataPacket[]>("SHOW DATABASES");
    return databases
      .map((r) => r.Database)
      .filter(
        (db) =>
          ![
            "information_schema",
            "performance_schema",
            "mysql",
            "sys",
          ].includes(db)
      ) as string[];
  } finally {
    conn.end();
  }
}
