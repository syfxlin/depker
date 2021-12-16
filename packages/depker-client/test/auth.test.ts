import {
  addToken,
  listTokens,
  login,
  loginByToken,
  removeToken,
} from "../src/api/auth";

const endpoint = "http://localhost:3000";

test("login", async () => {
  const token = await login({
    endpoint,
    token: "token",
  });
  expect(token && token.length > 0).toBe(true);
});

test("login by token", async () => {
  const token = await loginByToken({
    endpoint,
    token: "64375426-5530-426d-b7e9-ed49c42ce853",
  });
  expect(token && token.length > 0).toBe(true);
});

test("tokens", async () => {
  const token = await login({ endpoint, token: "token" });

  const tokens1 = await listTokens({ endpoint, token });

  const name = "11111";
  const t = await addToken({ endpoint, token, name });
  expect(t.name === name && t.token.length > 0).toBe(true);

  const tokens2 = await listTokens({ endpoint, token });
  expect(tokens1.length + 1 === tokens2.length).toBe(true);

  await removeToken({ endpoint, token, name });

  const tokens3 = await listTokens({ endpoint, token });
  expect(tokens1.length === tokens3.length).toBe(true);
});
