import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Box, Button, Space, Stack, Text } from "@mantine/core";
import { css } from "@emotion/react";
import { Heading } from "../components/parts/Heading";
import { useCalling } from "../hooks/use-calling";
import { openConfirmModal } from "@mantine/modals";
import { AppSettingContext } from "./AppSetting";

export const AppDangerTab: React.FC = () => {
  const { app } = useOutletContext<AppSettingContext>();
  const navigate = useNavigate();
  const calling = useCalling();
  return (
    <Stack
      css={css`
        height: 100%;
      `}
    >
      <Heading>Delete Application</Heading>
      <Box>
        <Text color="dimmed" size="sm">
          The application will be permanently deleted, including its deployments and logs. This action is irreversible.
        </Text>
        <Space pt="xs" />
        <Button
          color="red"
          loading={calling.loading}
          onClick={() => {
            openConfirmModal({
              title: "Delete Application",
              children: <Text size="sm">This action is irreversible. Confirm delete?</Text>,
              labels: { confirm: "Delete", cancel: "No don't delete it" },
              confirmProps: { color: "red" },
              onConfirm: () => {
                calling.calling(async (actions) => {
                  try {
                    await app.actions.delete();
                    actions.success(`Delete application successful`, `Application delete successful.`);
                    navigate(`/apps`);
                  } catch (e: any) {
                    actions.failure(`Delete application failure`, e);
                  }
                });
              },
            });
          }}
        >
          Delete
        </Button>
      </Box>
    </Stack>
  );
};
