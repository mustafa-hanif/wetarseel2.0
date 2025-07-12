import { createSignal, Show } from "solid-js";
import {
  useTableCRUD,
  createRecord,
  updateRecord,
  deleteRecord,
} from "@/hooks/useMutations";
import { dbquery } from "@/lib/useQueryTable";
import type { s } from "@wetarseel/db-types";

/**
 * Example component demonstrating how to use the unified mutation system
 * This shows CRUD operations for any table using the new mutation hooks
 */
export function ExampleCRUDComponent() {
  const [formData, setFormData] = createSignal({
    name: "",
    email: "",
    phone: "",
  });

  // Get users data using your existing query system
  const usersQuery = dbquery("users");

  // Set up CRUD operations with the new mutation system
  const userCRUD = useTableCRUD("users", {
    onSuccess: (data, variables) => {
      console.log(`${variables.operation} successful:`, data);
      // Reset form on successful create
      if (variables.operation === "create") {
        setFormData({ name: "", email: "", phone: "" });
      }
    },
    onError: (error) => {
      console.error("Mutation failed:", error.message);
    },
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    userCRUD.create(formData());
  };

  const handleUpdate = (
    userId: string,
    updates: Partial<s.UpdatableForTable<"users">>
  ) => {
    userCRUD.update(updates, userId);
  };

  const handleDelete = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      userCRUD.delete(userId);
    }
  };

  return (
    <div class="space-y-6 p-6">
      <h2 class="text-2xl font-bold">User Management Example</h2>

      {/* Create User Form */}
      <form
        onSubmit={handleSubmit}
        class="space-y-4 p-4 border rounded-lg bg-gray-50"
      >
        <h3 class="text-lg font-semibold">Create New User</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={formData().name}
            onInput={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            class="p-2 border rounded focus:border-blue-500 focus:outline-none"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={formData().email}
            onInput={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            class="p-2 border rounded focus:border-blue-500 focus:outline-none"
            required
          />

          <input
            type="tel"
            placeholder="Phone"
            value={formData().phone}
            onInput={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            class="p-2 border rounded focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={userCRUD.isCreating}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {userCRUD.isCreating ? "Creating..." : "Create User"}
        </button>

        <Show when={userCRUD.createError}>
          <p class="text-red-500 text-sm">{userCRUD.createError?.message}</p>
        </Show>
      </form>

      {/* Loading States */}
      <Show when={userCRUD.isLoading}>
        <div class="p-4 bg-blue-50 border border-blue-200 rounded">
          <p class="text-blue-700">
            {userCRUD.isCreating && "Creating user..."}
            {userCRUD.isUpdating && "Updating user..."}
            {userCRUD.isDeleting && "Deleting user..."}
          </p>
        </div>
      </Show>

      {/* Users List */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Users</h3>

        <Show
          when={usersQuery.data && !usersQuery.isLoading}
          fallback={<p class="text-gray-500">Loading users...</p>}
        >
          <div class="space-y-3">
            {usersQuery.data?.map((user) => (
              <div class="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                <div class="space-y-1">
                  <p class="font-medium text-gray-900">{user.name}</p>
                  <p class="text-gray-600 text-sm">{user.email}</p>
                  <Show when={(user as any).phone}>
                    <p class="text-gray-600 text-sm">{(user as any).phone}</p>
                  </Show>
                </div>

                <div class="flex space-x-2">
                  <button
                    onClick={() =>
                      handleUpdate(user.id, { name: user.name + " (Updated)" })
                    }
                    disabled={userCRUD.isUpdating}
                    class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 text-sm"
                  >
                    Update
                  </button>

                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={userCRUD.isDeleting}
                    class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Show>

        <Show when={usersQuery.error}>
          <p class="text-red-500">
            Error loading users: {usersQuery.error?.message}
          </p>
        </Show>
      </div>
    </div>
  );
}

/**
 * Example of using individual mutation functions for more granular control
 */
export function IndividualHooksExample() {
  const createUser = createRecord("users", {
    onSuccess: () => {
      console.log("User created successfully!");
    },
  });

  const updateUser = updateRecord("users");
  const deleteUser = deleteRecord("users");

  return (
    <div class="space-y-4 p-6">
      <h3 class="text-lg font-semibold">Individual Hooks Example</h3>

      <div class="flex space-x-2">
        <button
          onClick={() =>
            createUser.create({
              name: "John Doe",
              email: "john@example.com",
            })
          }
          disabled={createUser.isPending}
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {createUser.isPending ? "Creating..." : "Create User"}
        </button>

        <button
          onClick={() => updateUser.update({ name: "Jane Doe" }, "user-123")}
          disabled={updateUser.isPending}
          class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {updateUser.isPending ? "Updating..." : "Update User"}
        </button>

        <button
          onClick={() => deleteUser.delete("user-123")}
          disabled={deleteUser.isPending}
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {deleteUser.isPending ? "Deleting..." : "Delete User"}
        </button>
      </div>

      {/* Error displays */}
      <Show when={createUser.error}>
        <p class="text-red-500">Create error: {createUser.error?.message}</p>
      </Show>
      <Show when={updateUser.error}>
        <p class="text-red-500">Update error: {updateUser.error?.message}</p>
      </Show>
      <Show when={deleteUser.error}>
        <p class="text-red-500">Delete error: {deleteUser.error?.message}</p>
      </Show>
    </div>
  );
}
