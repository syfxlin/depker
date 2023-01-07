import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Box, Button, Space, Text } from "@mantine/core";
import { Heading } from "../components/parts/Heading";
import { useCalling } from "../hooks/use-calling";
import { openConfirmModal } from "@mantine/modals";
import { ServiceSettingContext } from "./ServiceSetting";
import { Tab } from "../components/layout/Tab";

export const ServiceDangerTab: React.FC = () => {
  const { service } = useOutletContext<ServiceSettingContext>();
  const navigate = useNavigate();
  const calling = useCalling();
  return (
    <Tab>
      <Heading>Delete Service</Heading>
      <Box>
        <Text color="dimmed" size="sm">
          The service will be permanently deleted, including its deployments and logs. This action is irreversible.
        </Text>
        <Space pt="xs" />
        <Button
          color="red"
          loading={calling.loading}
          onClick={() => {
            openConfirmModal({
              title: "Delete Service",
              children: <Text size="sm">This action is irreversible. Confirm delete?</Text>,
              labels: { confirm: "Delete", cancel: "No don't delete it" },
              confirmProps: { color: "red" },
              onConfirm: () => {
                calling.calling(async (actions) => {
                  try {
                    await service.actions.delete();
                    actions.success(`Delete service successful`, `The service has been successfully deleted.`);
                    navigate(`/services`);
                  } catch (e: any) {
                    actions.failure(`Delete service failure`, e);
                  }
                });
              },
            });
          }}
        >
          Delete
        </Button>
      </Box>
    </Tab>
  );
};
