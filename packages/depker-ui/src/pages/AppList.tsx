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
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { TbApiApp, TbApps, TbArrowUpRight, TbPlus, TbSearch, TbX } from "react-icons/all";
import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import { useApps } from "../api/use-apps";
import { Async } from "../components/core/Async";
import { Pages } from "../components/layout/Pages";
import { colors } from "../api/use-status";
import { client } from "../api/client";
import { openModal } from "@mantine/modals";
import { ObjectModal } from "../components/input/ObjectModal";
import { useAllBuildpacks } from "../api/use-all-buildpacks";
import { humanDate } from "../utils/human";

export const AppList: React.FC = () => {
  const t = useMantineTheme();
  const apps = useApps();
  const buildpacks = useAllBuildpacks();

  const Create = useMemo(
    () => (
      <Button
        leftIcon={<TbPlus />}
        onClick={() => {
          openModal({
            title: <>Create App</>,
            children: (
              <ObjectModal
                value={{}}
                onChange={async (value, actions) => {
                  if (!value.name || !value.buildpack) {
                    actions.failure(`Create app failure`, `Name, Buildpack must be not empty.`);
                    return false;
                  }
                  try {
                    await apps.actions.create({
                      name: value.name,
                      buildpack: value.buildpack,
                    });
                    actions.success(`Create volume successful`, `Close modals...`);
                    return true;
                  } catch (e: any) {
                    actions.failure(`Create volume failure`, e);
                    return false;
                  }
                }}
              >
                {(item, setItem) => [
                  <TextInput
                    key="name"
                    required
                    label="Name"
                    description="Application name, which should be 1-128 in length and support the characters 'a-zA-Z0-9._-'."
                    placeholder="Application Name"
                    icon={<TbApps />}
                    value={item.name ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setItem({ ...item, name: e.target.value })}
                  />,
                  <Select
                    key="buildpack"
                    required
                    searchable
                    label="Buildpack"
                    description="Building application with build package."
                    placeholder="Build Package"
                    nothingFound="No packages"
                    icon={<Avatar size="xs" src={client.asset.icon(buildpacks.data[item.buildpack]?.icon)} />}
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
                      icon: client.asset.icon(i.icon),
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
        value={apps.values.search}
        onChange={(e: ChangeEvent<HTMLInputElement>) => apps.update.search(e.target.value)}
        placeholder="Search apps"
        icon={<TbSearch />}
        rightSection={
          apps.values.search ? (
            <ActionIcon onClick={() => apps.update.search("")}>
              <TbX />
            </ActionIcon>
          ) : (
            <Text />
          )
        }
      />
    ),
    [apps.values.search]
  );

  const List = useMemo(
    () =>
      apps.data && (
        <Pages
          edges
          page={apps.values.page}
          size={apps.values.size}
          total={apps.data.total}
          onChange={apps.update.page}
        >
          <Grid>
            {apps.data?.items?.map((item) => (
              <Grid.Col key={`apps-${item.name}`} span={4}>
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
                    <Avatar src={client.asset.icon(item.icon)}>
                      <TbApiApp />
                    </Avatar>
                    <Link
                      to={`/apps/${item.name}`}
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
                    <Badge color={colors[item.status]}>{item.status}</Badge>
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
    [apps.data, apps.values.page, apps.values.size, apps.values.sort]
  );

  return (
    <Main
      title="Apps"
      header={
        <Group>
          {Search}
          {Create}
        </Group>
      }
    >
      <Async query={apps.query}>{List}</Async>
    </Main>
  );
};
