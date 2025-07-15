import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { createFileRoute, Link } from "@tanstack/solid-router";
import MoreHorizontalIcon from "lucide-solid/icons/more-horizontal";
import PencilIcon from "lucide-solid/icons/pencil";
import PlayCircleIcon from "lucide-solid/icons/play-circle";
import Trash2Icon from "lucide-solid/icons/trash-2";
import PlusCircle from "lucide-solid/icons/plus-circle";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { dbquery } from "@/lib/useQueryTable";
import type { ColumnDef } from "@tanstack/solid-table";
import type { s } from "@wetarseel/db-types";
import { useAuth } from "@/hooks/useAuth";
import { fetchQuery } from "@/queries/fetchQuery";

export const Route = createFileRoute("/(app)/agents/")({
  component: RouteComponent,
});

// Use the actual database type instead of a custom interface
type User = s.users.Selectable;

// Format date utility
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

function RouteComponent() {
  const query = fetchQuery<"users">(
    ["agents"],
    `${import.meta.env.VITE_API_URL}/api/accounts/users`
  );
  // Mock user data - replace with actual auth
  const user = { type: "admin" };
  const isDisabled = false;
  // const handleDeleteAgent = (agentId: string) => {
  //   // Mock delete - replace with actual API call
  //   setAgents(agents().filter((agent) => agent.id !== agentId));
  // };

  // Define table columns using the actual database schema
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: (info) => (
        <div class="font-medium text-gray-900">{info.getValue() as string}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (info) => (
        <div class="text-gray-500">{info.getValue() as string}</div>
      ),
    },
    {
      accessorKey: "created",
      header: "Created At",
      cell: (info) => (
        <div class="text-gray-500">{formatDate(info.getValue() as string)}</div>
      ),
    },
    {
      accessorKey: "updated",
      header: "Updated At",
      cell: (info) => (
        <div class="text-gray-500">{formatDate(info.getValue() as string)}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <Show when={user.type === "admin"}>
          <AgentActionDropdown
            agent={info.row.original}
            // onDelete={handleDeleteAgent}
          />
        </Show>
      ),
    },
  ];

  return (
    <Show
      when={query.data}
      fallback={
        <div class="h-full w-full flex flex-col justify-center items-center space-y-4">
          <div>Looks like you don't have any agents!</div>
          <Link to="/agents/create">
            <Button variant="secondary">
              <PlusCircle size={20} class="mr-2" />
              Create Agent
            </Button>
          </Link>
          <Button variant="secondary">
            <PlayCircleIcon size={20} class="mr-2" />
            Manage Teams
          </Button>
        </div>
      }
    >
      <div class="mx-auto p-6 bg-gray-100 min-h-full">
        <div class="flex mb-4">
          <div class="flex-1">
            <div class="text-gray-800 text-xl font-bold sm:text-2xl">
              Agent List
            </div>
            <p class="text-gray-600 mt-2">
              Select the agent which you would like to edit or delete
            </p>
          </div>
          <Show when={user.type === "admin"}>
            <div class="space-x-4">
              <Button variant="default" class="bg-orange-900">
                <PlayCircleIcon size={20} class="mr-2" />
                Manage Teams
              </Button>
              <Show
                when={!isDisabled}
                fallback={
                  <Button variant="secondary" disabled>
                    <PlusCircle size={20} class="mr-2" />
                    Create Agent
                  </Button>
                }
              >
                <Link to="/agents/create">
                  <Button variant="secondary">
                    <PlusCircle size={20} class="mr-2" />
                    Create Agent
                  </Button>
                </Link>
              </Show>
            </div>
          </Show>
        </div>

        <DataTable
          columns={columns}
          data={query.data ?? []}
          searchPlaceholder="Search agents..."
          enablePagination={true}
          pageSize={10}
        />
      </div>
    </Show>
  );
}

// Agent Action Dropdown Component
function AgentActionDropdown(props: {
  agent: User;
  // onDelete: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);
  let dropdownRef: HTMLDivElement | undefined;

  // Close dropdown when clicking outside
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() => {
      document.removeEventListener("mousedown", handleClickOutside);
    });
  });

  return (
    <div class="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        class="h-8 w-8 p-0 hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen())}
      >
        <span class="sr-only">Open menu</span>
        <MoreHorizontalIcon size={16} />
      </Button>

      <Show when={isOpen()}>
        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
          <div class="py-1">
            <div class="px-4 py-2 text-sm font-medium text-gray-900 border-b">
              Actions
            </div>
            <button
              class="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
              onClick={() => {
                setIsOpen(false);
                // Handle edit action
                console.log("Edit agent:", props.agent.id);
              }}
            >
              <PencilIcon size={16} class="mr-2" />
              Edit
            </button>
            <button
              class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              onClick={() => {
                setIsOpen(false);
                setShowDeleteDialog(true);
              }}
            >
              <Trash2Icon size={16} class="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </Show>

      {/* Delete confirmation dialog */}
      <Show when={showDeleteDialog()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Are you sure you want to delete the agent {props.agent.name}?
            </h3>
            <div class="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  // props.onDelete(props.agent.id);
                  setShowDeleteDialog(false);
                }}
              >
                Yes Delete
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
