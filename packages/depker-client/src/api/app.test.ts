import { DepkerClient } from "../client";

const create = async () => {
  const token = { value: "" };
  const client = new DepkerClient({ endpoint: "http://localhost:3000", token: () => token.value });
  token.value = await client.auth.login({ username: "admin", password: "password" });
  return client;
};

it("should list apps", async () => {
  const client = await create();
  const results = await client.app.list();

  console.log(results);
  expect(results.total).not.toBeNull();
  expect(results.items).not.toBeNull();
});

it("should upsert app", async () => {
  const client = await create();
  const results = await client.app.upsert({
    name: "depker",
    buildpack: {
      name: "dockerfile",
      values: {},
    },
    commands: [],
    ports: [
      {
        name: "8080",
        port: 80,
      },
    ],
    volumes: [
      {
        name: "test",
        path: "/mnt/test",
        readonly: false,
      },
    ],
  });

  console.log(results);
  expect(results).not.toBeNull();
});

it("should get app", async () => {
  const client = await create();
  const results = await client.app.get({ name: "depker" });

  console.log(results);
  expect(results).not.toBeNull();
});

it("should delete", async () => {
  const client = await create();
  const results = await client.app.delete({ name: "depker" });

  console.log(results);
  expect(results).not.toBeNull();
});

it("should status", async () => {
  const client = await create();
  const results = await client.app.status({ names: ["depker-traefik"] });

  console.log(results);
  expect(results).not.toBeNull();
});
