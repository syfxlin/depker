import React from "react";
import { Button, Center, Container, Paper, PasswordInput, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { AxiosError } from "axios";
import { useU } from "@syfxlin/ustyled";
import { css } from "@emotion/react";
import { client, login } from "../api/client";
import { AnonymousView } from "../router/AnonymousView";

export const Login: React.FC = () => {
  const { u } = useU();
  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (value) => (value ? null : "Username must be not empty."),
      password: (value) => (value ? null : "Password must be not empty."),
    },
  });

  return (
    <AnonymousView>
      <Center
        css={css`
          flex: 1;
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
                .then((token) => {
                  login(token);
                  showNotification({
                    title: "Login successful",
                    message: "Redirecting...",
                    color: "green",
                  });
                })
                .catch((e: AxiosError) => {
                  showNotification({
                    title: "Login failure",
                    message: (e.response?.data as any)?.message ?? e.message,
                  });
                })
            )}
          >
            <TextInput label="Username" placeholder="Your username" required {...form.getInputProps("username")} />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              mt="md"
              {...form.getInputProps("password")}
            />
            <Button fullWidth mt="xl" type="submit">
              Login
            </Button>
          </Paper>
        </Container>
      </Center>
    </AnonymousView>
  );
};
