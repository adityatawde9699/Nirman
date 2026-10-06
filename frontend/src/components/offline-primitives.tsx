/** Build-only compatibility adapters when optional UI packages cannot be downloaded. */
import * as React from "react";
type Options = {
  variant?: "default" | "outline" | "ghost" | "destructive" | null;
  size?: "default" | "sm" | null;
  className?: string;
};
export type VariantProps<T> = Omit<Options, "className">;
export function cva(
  base: string,
  config: {
    variants: { variant: Record<string, string>; size: Record<string, string> };
    defaultVariants: { variant: string; size: string };
  },
) {
  return (options: Options = {}) =>
    [
      base,
      config.variants.variant[
        options.variant || config.defaultVariants.variant
      ],
      config.variants.size[options.size || config.defaultVariants.size],
      options.className,
    ]
      .filter(Boolean)
      .join(" ");
}
export function Slot({
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  if (!React.isValidElement(children)) return null;
  return React.cloneElement(
    children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    props,
  );
}
