import { DepkerClient } from "../client";

jest.setTimeout(100_000);

const create = async () => {
  const token = { value: "" };
  const client = new DepkerClient({ endpoint: "http://localhost:3000", token: () => token.value });
  token.value = await client.auth.login({ username: "admin", password: "password" });
  return client;
};

it("should metrics", async () => {
  const client = await create();
  const metrics = await client.system.metrics();

  console.log(metrics);
  expect(metrics).not.toBeNull();
});

it("should version", async () => {
  const client = await create();
  const version = await client.system.version();

  console.log(version);
  expect(version).not.toBeNull();
});

it("should logs", async () => {
  const client = await create();
  const logs = await client.system.logs();

  console.log(logs);
  expect(logs).not.toBeNull();
});
