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
import {
  createEffect,
  Show,
  For,
  Accessor,
  createSignal,
  createMemo,
} from "solid-js";
import { Icon } from "@iconify-icon/solid";
import { dbquery } from "@/lib/useQueryTable";

import { UseQueryResult } from "@tanstack/solid-query";
import { Conversation } from "@/types/chat";
import { queryClient } from "@/hooks/useQuery";
import { useSequentialConversations } from "@/hooks/useSequentialConversationsWithMeta";

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
      name: "leads",
      text: "Leads",
      icon: "material-symbols:groups-outline",
      iconActive: "material-symbols:groups",
      href: "/leads",
    },
    {
      name: "conversations",
      text: "Conversations",
      icon: "material-symbols:chat-outline",
      iconActive: "material-symbols:chat",
      href: "/conversations",
    },
    {
      name: "broadcast",
      text: "Broadcast",
      icon: "material-symbols:campaign-outline",
      iconActive: "material-symbols:campaign",
      href: "/broadcast",
    },
    {
      name: "automation",
      text: "Automation",
      icon: "material-symbols:smart-toy-outline",
      iconActive: "material-symbols:smart-toy",
      href: "/automation",
    },
    {
      name: "analytics",
      text: "Analytics",
      icon: "material-symbols:analytics-outline",
      iconActive: "material-symbols:analytics",
      href: "/analytics",
    },
    {
      name: "integrations",
      text: "Integrations",
      icon: "material-symbols:extension-outline",
      iconActive: "material-symbols:extension",
      href: "/integrations",
    },
    {
      name: "team",
      text: "Team",
      icon: "material-symbols:people-outline",
      iconActive: "material-symbols:people",
      href: "/team",
    },
    {
      name: "office-settings",
      text: "Settings",
      icon: "ph:gear",
      iconActive: "ph:gear-fill",
      href: "/office-settings",
    },
  ];
};

let websocket: WebSocket | undefined;

function RouteComponent() {
  const data = useAuth();
  const currentData2 = useSequentialConversations(
    data.data?.email ?? "icemelt7@gmail.com"
  );
  const location = useLocation();

  const account = dbquery("accounts", () => ({
    filter: `id.=.` + data.data?.accountId,
    limit: 1,
    skipAccountCheck: true,
  }));

  createEffect(() => {
    const accountId = data.data?.accountId;
    const currentData = currentData2.query();
    // Access current conversation state at message time (not closure time)
    if (accountId && account().data?.[0]?.phone_id) {
      // Only create WebSocket if we don't have one
      if (!websocket && currentData.status === "success") {
        console.log(currentData.status);
        console.log("Creating WebSocket connection for account:", accountId);

        const wsUrl = `wss://vxgv2qg8ae.execute-api.me-central-1.amazonaws.com/dev?phoneNumberId=${account().data?.[0]?.phone_id}&userId=${data.data?.email}`;
        websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
          console.log("WebSocket connected successfully");
        };

        websocket.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        websocket.onmessage = (event) => {
          try {
            const wsData = JSON.parse(event.data);
            console.log("Raw WebSocket data received:", wsData);

            if (wsData.type === "message_received") {
              const from = wsData.message.from;
              console.log("WebSocket message received:", {
                from,
                currentUnreadCount: wsData.currentUnreadCount,
              });

              console.log("Current conversation state at message time:", {
                isLoading: currentData.isLoading,
                isPending: currentData.isPending,
                isSuccess: currentData.isSuccess,
                dataLength: currentData.data?.length,
              });

              const convo = currentData.data?.find(
                (convo) => convo.leads.phone_number === from
              );

              if (convo && data.data?.email) {
                console.log("Found convo:", convo.id);
                console.log(
                  "WebSocket currentUnreadCount:",
                  wsData.currentUnreadCount
                );

                // Update both small and large query keys for the new metadata API
                const updateQueryData = (limit: number) => {
                  const params = {
                    userId: data.data.email, // Use email to match the hook
                    filter: "all" as const,
                    limit,
                  };
                  const queryKey = ["conversations", params];

                  console.log("Updating query key:", queryKey);

                  queryClient.setQueryData(
                    queryKey,
                    (dataA: Conversation[] | undefined) => {
                      if (!dataA) return dataA;

                      return dataA.map((conversation) => {
                        if (conversation.id === convo.id) {
                          console.log(
                            "Updating conversation:",
                            conversation.id,
                            "with unread count:",
                            wsData.currentUnreadCount
                          );
                          return {
                            ...conversation,
                            messages: {
                              ...conversation.messages,
                              message: wsData.message.text.body,
                              created: new Date().toISOString(),
                              type: "text",
                            },
                            unreadCount: wsData.currentUnreadCount,
                          };
                        }
                        return conversation;
                      });
                    }
                  );
                };

                // Update both small (10) and large (100000) query caches
                updateQueryData(100000);
              } else {
                console.log("No convo found for:", from, "or no user email");
              }
            }
          } catch (err) {
            console.error("Error handling WebSocket message:", err);
          }
        };
      } // Close the if (!websocket) block
    } // Close the if (accountId) block
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
                            class="w-6 h-6"
                          />
                          <span class="text-xs font-medium">{item.text}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        {/* Main Content */}
        <main class="flex-1 bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </Show>
  );
}
