import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth-client";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
  useLocation,
} from "@tanstack/solid-router";
import { createEffect, Show, For } from "solid-js";
import { Icon } from "@iconify-icon/solid";

export const Route = createFileRoute("/(app)")({
  component: RouteComponent,
});

// Menu items matching the legacy sidebar
const getMenuList = () => {
  return [
    {
      name: "dashboard",
      text: "Dashboard",
      icon: "material-symbols:dashboard-outline",
      iconActive: "material-symbols:dashboard",
      href: "/dashboard",
    },
    {
      name: "live-chat",
      text: "Live Chat",
      icon: "mdi:conversation-outline",
      iconActive: "mdi:conversation",
      href: "/chat",
    },
    {
      name: "lead-management",
      text: "Contacts",
      icon: "mdi:account",
      iconActive: "mdi:account",
      href: "/contacts",
    },
    {
      name: "templates",
      text: "Templates",
      icon: "mdi:file-document-outline",
      iconActive: "mdi:file-document",
      href: "/templates",
    },
    {
      name: "campaigns",
      text: "Campaigns",
      icon: "mdi:bullhorn-outline",
      iconActive: "mdi:bullhorn",
      href: "/campaigns",
    },
    {
      name: "reports",
      text: "Reports",
      icon: "mdi:chart-line",
      iconActive: "mdi:chart-line",
      href: "/reports",
    },
    {
      name: "agents",
      text: "Agents",
      icon: "mdi:account-group-outline",
      iconActive: "mdi:account-group",
      href: "/agents",
    },
    {
      name: "flows",
      text: "Flows",
      icon: "mdi:workflow",
      iconActive: "mdi:workflow",
      href: "/flows",
    },
    {
      name: "messaging-limits",
      text: "Messaging Limits",
      icon: "mdi:message-settings-outline",
      iconActive: "mdi:message-settings",
      href: "/messaging-limits",
    },
    {
      name: "api-settings",
      text: "API Settings",
      icon: "mdi:api",
      iconActive: "mdi:api",
      href: "/api-settings",
    },
    {
      name: "office-settings",
      text: "Office Settings",
      icon: "ph:gear",
      iconActive: "ph:gear-fill",
      href: "/office-settings",
    },
  ];
};

function RouteComponent() {
  const data = useAuth();
  const router = useRouter();
  const location = useLocation();

  createEffect(() => {
    if (data.data) {
      console.log("User is authenticated:", data.data.email);
    }
    if (data.isError) {
      router.history.push("/auth/sign-in");
    }
  });

  const navItems = getMenuList();
  return (
    <Show when={data.data}>
      <div class="flex h-screen">
        {/* Sidebar matching legacy design */}
        <div class="h-full bg-zinc-950 hidden md:block overflow-y-auto hide-scrollbar w-24">
          <div class="flex flex-col space-y-5 mt-7 m-2">
            {/* Logo */}
            <img
              src="/assets/WT_Logo.png"
              width={50}
              height={50}
              alt="logo"
              class="mx-auto w-auto"
            />

            {/* Navigation Items */}
            <For each={navItems}>
              {(item) => {
                const isActive = () => location().pathname.includes(item.name);

                return (
                  <div>
                    <Link to={item.href}>
                      <div
                        id={item.name}
                        class={`cursor-pointer ${
                          isActive() ? "text-white font-bold" : "text-gray-400"
                        }`}
                      >
                        <div
                          class={`flex flex-col items-center text-center space-y-1 rounded-lg p-2 hover:bg-zinc-900 ${
                            isActive() && "bg-zinc-900"
                          }`}
                        >
                          <Icon
                            icon={isActive() ? item.iconActive : item.icon}
                            width={20}
                            height={20}
                          />
                          <div class="text-xs">{item.text}</div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        {/* Main content */}
        <main class="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </Show>
  );
}
