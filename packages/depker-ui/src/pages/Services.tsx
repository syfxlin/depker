import React, { ChangeEvent, forwardRef, useMemo } from "react";
import { Main } from "../components/layout/Main";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Input,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { TbApiApp, TbApps, TbArrowUpRight, TbMoon, TbPlus, TbSearch, TbX } from "react-icons/all";
import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import { useServices } from "../api/use-services";
import { Async } from "../components/core/Async";
import { Pages } from "../components/layout/Pages";
import { colors } from "../api/use-status";
import { client } from "../api/client";
import { openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { useBuildpacks } from "../api/use-buildpacks";
import { humanDate } from "../utils/human";

export const Services: React.FC = () => {
  const t = useMantineTheme();
  const services = useServices();
  const buildpacks = useBuildpacks();

  const Create = useMemo(
    () => (
      <Button
        leftIcon={<TbPlus />}
        onClick={() => {
          openModal({
            title: <>Create Service</>,
            children: (
              <ObjectModal
                value={{}}
                onChange={async (value, actions) => {
                  if (!value.name || !value.type || !value.buildpack) {
                    actions.failure(`Create service failure`, `Name, Type, Buildpack must be not empty.`);
                    return false;
                  }
                  try {
                    await services.actions.create({
                      name: value.name,
                      type: value.type,
                      buildpack: value.buildpack,
                    });
                    actions.success(`Create service successful`, `Click service to enter configuration.`);
                    return true;
                  } catch (e: any) {
                    actions.failure(`Create service failure`, e);
                    return false;
                  }
                }}
              >
                {(item, setItem) => [
                  <TextInput
                    key="name"
                    required
                    label="Name"
                    description="Service name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
                    placeholder="Service Name"
                    icon={<TbApps />}
                    value={item.name ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
                  />,
                  <Select
                    key="type"
                    required
                    label="Type"
                    description="Service type, App is a resident service, and Job is a scheduled or one-time service"
                    placeholder="Type"
                    icon={<TbMoon />}
                    value={item.type ?? ""}
                    onChange={(value: string) => setItem({ ...item, type: value })}
                    data={[
                      {
                        value: "app",
                        label: "App",
                      },
                      {
                        value: "job",
                        label: "Job",
                      },
                    ]}
                  />,
                  <Select
                    key="buildpack"
                    required
                    searchable
                    label="Buildpack"
                    description="Building service with build package."
                    placeholder="Build Package"
                    nothingFound="No packages"
                    icon={<Avatar size="xs" src={client.assets.icon(buildpacks.data[item.buildpack]?.icon)} />}
                    value={item.buildpack ?? ""}
                    onChange={(value: string) => {
                      const buildpack = buildpacks.data[value];
                      if (!buildpack) {
                        return;
                      }
                      setItem({ ...item, buildpack: value });
                    }}
                    data={Object.values(buildpacks.data).map((i) => ({
                      value: i.name,
                      label: i.label,
                      group: i.group,
                      icon: client.assets.icon(i.icon),
                    }))}
                    itemComponent={forwardRef<HTMLDivElement, any>(({ label, icon, ...props }, ref) => {
                      return (
                        <Group noWrap ref={ref} {...props}>
                          <Avatar size="xs" src={icon}>
                            <TbApiApp />
                          </Avatar>
                          <Text size="sm">{label}</Text>
                        </Group>
                      );
                    })}
                  />,
                ]}
              </ObjectModal>
            ),
          });
        }}
      >
        Create
      </Button>
    ),
    [buildpacks.data]
  );

  const Search = useMemo(
    () => (
      <Input
        value={services.values.search}
        onChange={(e: ChangeEvent<HTMLInputElement>) => services.update.search(e.target.value)}
        placeholder="Search services"
        icon={<TbSearch />}
        rightSection={
          services.values.search ? (
            <ActionIcon onClick={() => services.update.search("")}>
              <TbX />
            </ActionIcon>
          ) : (
            <Text />
          )
        }
      />
    ),
    [services.values.search]
  );

  const List = useMemo(
    () =>
      services.data && (
        <Pages
          edges
          page={services.values.page}
          size={services.values.size}
          total={services.data.total}
          onChange={services.update.page}
        >
          <Grid>
            {services.data?.items?.map((item) => (
              <Grid.Col key={`services-${item.name}`} span={4}>
                <Card
                  withBorder
                  css={css`
                    padding: ${t.spacing.md}px ${t.spacing.lg}px;
                    border-radius: ${t.radius.sm}px;
                    overflow: visible;

                    &:hover {
                      background-color: ${t.colorScheme === "light" ? t.colors.gray[0] : t.colors.dark[5]};
                    }
                  `}
                >
                  <Group>
                    <Avatar src={client.assets.icon(item.icon)}>
                      <TbApiApp />
                    </Avatar>
                    <Link
                      to={`/services/${item.name}`}
                      css={css`
                        flex: 1;
                        text-decoration: none;
                        width: 100%;
                        overflow: hidden;

                        .mantine-Badge-root {
                          text-transform: none;
                          text-overflow: ellipsis;
                          max-width: 100%;
                        }
                      `}
                    >
                      <Text
                        css={css`
                          display: block;
                          color: ${t.fn.primaryColor()};
                          font-size: ${t.fontSizes.xl}px;
                          font-weight: 500;
                          text-decoration: none;
                          margin-bottom: ${t.spacing.xs * 0.5}px;
                        `}
                      >
                        {item.name}
                      </Text>
                      {item.buildpack && (
                        <Text size="xs" color="dimmed">
                          Buildpack: {item.buildpack}
                        </Text>
                      )}
                      <Text size="xs" color="dimmed">
                        Domain: {item.domain || "No configuration"}
                      </Text>
                      <Tooltip
                        label={
                          <Text
                            css={css`
                              font-size: ${t.fontSizes.xs}px;
                              font-family: ${t.fontFamilyMonospace};
                            `}
                          >
                            Deployd in {item.deploydAt !== 0 ? humanDate(item.deploydAt) : "No deployment"}
                            <br />
                            Created in {humanDate(item.createdAt)}
                            <br />
                            Updated in {humanDate(item.updatedAt)}
                          </Text>
                        }
                      >
                        <Text size="xs" color="dimmed">
                          Uptime: {item.deploydAt !== 0 ? humanDate(item.deploydAt) : "No deployment"}
                        </Text>
                      </Tooltip>
                    </Link>
                    <Stack spacing="xs">
                      <Badge color={colors[item.status]}>{item.status}</Badge>
                      <Badge color={item.type === "app" ? "blue" : "grape"}>{item.type}</Badge>
                    </Stack>
                    {item.domain && item.domain.length && (
                      <ActionIcon color={t.primaryColor} size="lg" onClick={() => window.open(`http://${item.domain}`)}>
                        <TbArrowUpRight />
                      </ActionIcon>
                    )}
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Pages>
      ),
    [services.data, services.values.page, services.values.size, services.values.sort]
  );

  return (
    <Main
      title="Services"
      header={
        <Group>
          {Search}
          {Create}
        </Group>
      }
    >
      <Async query={services.query}>{List}</Async>
    </Main>
  );
};
