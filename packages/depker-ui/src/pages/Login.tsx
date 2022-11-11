import React from "react";
import {
  Button,
  Center,
  Container,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { css } from "@emotion/react";
import { client, login } from "../api/client";
import { AnonymousView } from "../router/AnonymousView";
import { useCalling } from "../hooks/use-calling";

export const Login: React.FC = () => {
  const t = useMantineTheme();
  const calling = useCalling();
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
            margin-top: ${t.spacing.md}px;
            margin-bottom: ${t.spacing.md}px;
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
              margin-top: ${t.spacing.xs}px;
              font-size: ${t.fontSizes.sm}px;
            `}
          >
            Please login to continue.
          </Text>
          <Paper
            withBorder
            css={css`
              margin-top: ${t.spacing.xl}px;
              padding: ${t.spacing.xl}px;
              border-radius: ${t.radius.sm}px;
              box-shadow: ${t.shadows.sm};
            `}
            component="form"
            onSubmit={form.onSubmit((values) => {
              calling.calling(async (actions) => {
                try {
                  const token = await client.auth.auth(values);
                  login(token);
                  actions.success(`Login successful`, `Redirecting...`);
                } catch (e: any) {
                  actions.failure(`Login failure`, e);
                }
              });
            })}
          >
            <TextInput label="Username" placeholder="Your username" required {...form.getInputProps("username")} />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              mt="md"
              {...form.getInputProps("password")}
            />
            <Button fullWidth mt="xl" type="submit" loading={calling.loading}>
              Login
            </Button>
          </Paper>
        </Container>
      </Center>
    </AnonymousView>
  );
};
