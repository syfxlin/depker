import React, { PropsWithChildren } from "react";
import { MantineProvider, MantineThemeOverride } from "@mantine/core";
import { useU, UstyledCtx } from "@syfxlin/ustyled";
import { rem2px } from "../utils/rem2px";

export const convert = (ctx: UstyledCtx): MantineThemeOverride => {
  return {
    loader: "dots",
    colorScheme: ctx.mode,
    white: ctx.colors.white as string,
    black: ctx.colors.black as string,
    colors: ctx.colors as any,
    primaryColor: ctx.primary,
    fontFamily: ctx.fonts.sans,
    fontFamilyMonospace: ctx.fonts.mono,
    transitionTimingFunction: ctx.timingFns.default,
    lineHeight: ctx.lineHeights.normal,
    fontSizes: {
      xs: rem2px(ctx.fontSizes.xs),
      sm: rem2px(ctx.fontSizes.sm),
      md: rem2px(ctx.fontSizes.default),
      lg: rem2px(ctx.fontSizes.lg),
      xl: rem2px(ctx.fontSizes.xl),
    },
    radius: {
      xs: rem2px(ctx.borderRadius.unit as string) * 0.5,
      sm: rem2px(ctx.borderRadius.unit as string) * 1,
      md: rem2px(ctx.borderRadius.unit as string) * 2,
      lg: rem2px(ctx.borderRadius.unit as string) * 4,
      xl: rem2px(ctx.borderRadius.unit as string) * 8,
    },
    spacing: {
      xs: rem2px(ctx.spacings.unit as string) * 2,
      sm: rem2px(ctx.spacings.unit as string) * 3,
      md: rem2px(ctx.spacings.unit as string) * 4,
      lg: rem2px(ctx.spacings.unit as string) * 5,
      xl: rem2px(ctx.spacings.unit as string) * 6,
    },
    breakpoints: {
      xs: rem2px(ctx.breakpoints.xs),
      sm: rem2px(ctx.breakpoints.sm),
      md: rem2px(ctx.breakpoints.md),
      lg: rem2px(ctx.breakpoints.lg),
      xl: rem2px(ctx.breakpoints.xl),
    },
    shadows: ctx.shadows as any,
    headings: {
      fontFamily: ctx.fonts.sans,
      fontWeight: 400,
    },
  };
};

export const MantineAdapter: React.FC<PropsWithChildren> = ({ children }) => {
  const { ctx } = useU();
  return (
    <MantineProvider theme={convert(ctx)} withNormalizeCSS={false} withGlobalStyles={false}>
      {children}
    </MantineProvider>
  );
};
