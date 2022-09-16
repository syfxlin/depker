import React from "react";
import { Button, Center, Container, Paper, PasswordInput, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { AxiosError } from "axios";
import { useU } from "@syfxlin/ustyled";
import { css } from "@emotion/react";
import { client } from "../api/client";

export const Login: React.FC = () => {
  const { u } = useU();
  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (value) => (value ? null : "用户名不能为空！"),
      password: (value) => (value ? null : "密码不能为空！"),
    },
  });

  return (
    <Center
      css={css`
        height: 100%;
      `}
    >
      <Container
        css={css`
          width: 100%;
          max-width: 28rem;
          margin-top: ${u.sp("md")};
          margin-bottom: ${u.sp("md")};
        `}
      >
        <Title
          css={css`
            text-align: center;
            font-weight: 400;
          `}
        >
          Welcome back to depker!
        </Title>
        <Text
          color="dimmed"
          css={css`
            text-align: center;
            margin-top: ${u.sp(1)};
            font-size: ${u.fs("sm")};
          `}
        >
          Please login to continue.
        </Text>
        <Paper
          withBorder
          css={css`
            margin-top: ${u.sp(7)};
            padding: ${u.sp(7)};
            border-radius: ${u.br(1)};
            box-shadow: ${u.sh("sm")};
          `}
          component="form"
          onSubmit={form.onSubmit((values) =>
            client.auth
              .login(values)
              .then(() =>
                showNotification({
                  title: "登录成功",
                  message: "正在跳转。。。",
                  color: "green",
                })
              )
              .catch((e: AxiosError) =>
                showNotification({
                  title: "登录失败",
                  message: (e.response?.data as any)?.message ?? e.message,
                })
              )
          )}
        >
          <TextInput label="用户名" placeholder="你的用户名" required {...form.getInputProps("username")} />
          <PasswordInput label="密码" placeholder="你的密码" required mt="md" {...form.getInputProps("password")} />
          <Button fullWidth mt="xl" type="submit">
            登录
          </Button>
        </Paper>
      </Container>
    </Center>
  );
};
