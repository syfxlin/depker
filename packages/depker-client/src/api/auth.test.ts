import { DepkerClient } from "../client";

it("should login", async () => {
  const client = new DepkerClient({ endpoint: "http://localhost:3000" });
  const token = await client.auth.login({ username: "admin", password: "password" });
  console.log(token);
  expect(token).not.toBeNull();
});
