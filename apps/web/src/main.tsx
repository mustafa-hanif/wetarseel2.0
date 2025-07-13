import { render } from "solid-js/web";
import { RouterProvider, createRouter } from "@tanstack/solid-router";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/solid-query";
import { routeTree } from "./routeTree.gen";
import "./styles.css";
import { queryClient } from "./hooks/useQuery";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultStaleTime: 5000,
  scrollRestoration: true,
});

// Register things for typesafety
declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  render(
    () => (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <SolidQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    ),
    rootElement
  );
}
