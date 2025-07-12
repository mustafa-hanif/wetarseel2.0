import {
  HeadContent,
  Link,
  Outlet,
  createRootRoute,
} from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <Outlet />
      {import.meta.env.MODE === "development" ? (
        <TanStackRouterDevtools position="bottom-right" />
      ) : null}
    </>
  );
}
