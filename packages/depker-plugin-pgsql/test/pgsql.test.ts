import { Client } from "pg";

test("pgsql", async () => {
  const client = new Client({
    user: "postgres",
    password: "123456",
  });
  await client.connect();
  // const result = await client.query(`
  //   DO
  //   $do$
  //   BEGIN
  //     IF NOT exists(SELECT FROM pg_catalog.pg_user WHERE usename = 'test1') THEN
  //       CREATE USER test1 WITH PASSWORD '123456';
  //     END IF;
  //   END
  //   $do$
  // `);
  const result = await client.query(
    `SELECT exists(SELECT FROM pg_catalog.pg_database WHERE datname = 'test1')`
  );
  if (!result.rows[0].exists) {
    await client.query(`CREATE DATABASE test1`);
  }
  console.log(result);
});
