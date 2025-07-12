import { cn } from "@/libs/cn";
import type { CollapsibleContentProps, CollapsibleRootProps, CollapsibleTriggerProps } from "@kobalte/core/collapsible";
import { Collapsible as CollapsiblePrimitive } from "@kobalte/core/collapsible";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent, VoidProps } from "solid-js";
import { splitProps } from "solid-js";

type collapsibleRootProps<T extends ValidComponent = "div"> = CollapsibleRootProps<T> & {
  class?: string;
};

export const Collapsible = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, collapsibleRootProps<T>>,
) => {
  const [local, rest] = splitProps(props as collapsibleRootProps, ["class"]);

  return (
    <CollapsiblePrimitive
      class={cn("", local.class)}
      {...rest}
    />
  );
};

type collapsibleTriggerProps<T extends ValidComponent = "button"> = VoidProps<
  CollapsibleTriggerProps<T> & { class?: string }
>;

export const CollapsibleTrigger = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, collapsibleTriggerProps<T>>,
) => {
  const [local, rest] = splitProps(props as collapsibleTriggerProps, [
    "class",
    "children",
  ]);

  return (
    <CollapsiblePrimitive.Trigger
      class={cn(
        "flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-expanded]>svg]:rotate-180",
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </CollapsiblePrimitive.Trigger>
  );
};

type collapsibleContentProps<T extends ValidComponent = "div"> = VoidProps<
  CollapsibleContentProps<T> & { class?: string }
>;

export const CollapsibleContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, collapsibleContentProps<T>>,
) => {
  const [local, rest] = splitProps(props as collapsibleContentProps, [
    "class",
    "children",
  ]);

  return (
    <CollapsiblePrimitive.Content
      class={cn(
        "overflow-hidden text-sm data-[expanded]:animate-collapsible-down data-[closed]:animate-collapsible-up",
        local.class,
      )}
      {...rest}
    >
      <div class="pb-4 pt-0">{local.children}</div>
    </CollapsiblePrimitive.Content>
  );
};
