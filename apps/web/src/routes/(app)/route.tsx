import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth-client";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/solid-router";
import { createEffect, Show } from "solid-js";

export const Route = createFileRoute("/(app)")({
  component: RouteComponent,
});

function RouteComponent() {
  const data = useAuth();
  const router = useRouter();
  createEffect(() => {
    if (data.data) {
      console.log("User is authenticated:", data.data.email);
    }
    if (data.isError) {
      router.history.push("/auth/sign-in");
    }
  });
  return (
    <Show when={data.data}>
      <div class="p-2 flex gap-2">
        <aside class="w-1/4 bg-blue-300">
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <Link to="/chat">chat</Link>
              </li>
            </ul>
          </nav>
        </aside>
        <Outlet />
      </div>
    </Show>
  );
}
