import { useMutation, useQueryClient } from "@tanstack/solid-query";
import type { s } from "@wetarseel/db-types";

type TableName = s.Table;
type MutationType = "create" | "update" | "delete";

interface BaseMutationPayload {
  table: TableName;
  operation: MutationType;
}

interface CreateMutationPayload extends BaseMutationPayload {
  operation: "create";
  data: Record<string, any>;
}

interface UpdateMutationPayload extends BaseMutationPayload {
  operation: "update";
  data: Record<string, any>;
  id?: string;
  where?: Record<string, any>;
}

interface DeleteMutationPayload extends BaseMutationPayload {
  operation: "delete";
  id?: string;
  where?: Record<string, any>;
}

type MutationPayload =
  | CreateMutationPayload
  | UpdateMutationPayload
  | DeleteMutationPayload;

interface MutationResponse {
  success: boolean;
  operation: MutationType;
  data?: any;
}

const executeMutation = async (
  payload: MutationPayload,
  skipAccountCheck?: boolean
): Promise<MutationResponse> => {
  let url: string;
  let method: string;
  let body: string | undefined;

  switch (payload.operation) {
    case "create":
      url = `/api/mutations/${payload.table}`;
      if (skipAccountCheck) {
        url += "?skipAccountCheck=true";
      }
      method = "POST";
      body = JSON.stringify(payload);
      break;

    case "update":
      url = `/api/mutations/${payload.table}`;
      method = "PUT";
      body = JSON.stringify(payload);
      break;

    case "delete":
      if (payload.id) {
        url = `/api/mutations/${payload.table}/${payload.id}`;
        method = "DELETE";
      } else {
        url = `/api/mutations/${payload.table}`;
        method = "DELETE";
        body = JSON.stringify(payload);
      }
      break;

    default:
      throw new Error("Invalid operation");
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important for auth cookies
    body,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Mutation failed");
  }

  return response.json();
};

// Main mutation hook
export const useTableMutation = <T extends TableName>(
  table: T,
  options?: {
    skipAccountCheck?: boolean;
    onSuccess?: (data: any, variables: MutationPayload) => void;
    onError?: (error: Error, variables: MutationPayload) => void;
    invalidateQueries?: boolean;
  }
) => {
  const queryClient = useQueryClient();

  return useMutation<MutationResponse, Error, Omit<MutationPayload, "table">>(
    () => ({
      mutationFn: (payload: Omit<MutationPayload, "table">) =>
        executeMutation(
          { ...payload, table } as MutationPayload,
          options?.skipAccountCheck
        ),

      onSuccess: (
        data: MutationResponse,
        variables: Omit<MutationPayload, "table">
      ) => {
        if (options?.invalidateQueries !== false) {
          // Invalidate table queries to refetch data
          queryClient.invalidateQueries({ queryKey: [table] });

          // Also invalidate any expanded queries
          queryClient.invalidateQueries({
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              query.queryKey.some(
                (key) =>
                  typeof key === "object" &&
                  key &&
                  "table" in key &&
                  key.table === table
              ),
          });
        }

        options?.onSuccess?.(data, { ...variables, table } as MutationPayload);
      },

      onError: (error: Error, variables: Omit<MutationPayload, "table">) => {
        options?.onError?.(
          error as Error,
          { ...variables, table } as MutationPayload
        );
      },
    })
  );
};

// Convenience functions for specific operations
export const createRecord = <T extends TableName>(
  table: T,
  options?: Parameters<typeof useTableMutation>[1]
) => {
  const mutation = useTableMutation(table, options);

  return {
    ...mutation,
    create: (data: s.InsertableForTable<T>) =>
      mutation.mutate({ operation: "create", data } as Omit<
        CreateMutationPayload,
        "table"
      >),
  };
};

export const updateRecord = <T extends TableName>(
  table: T,
  options?: Parameters<typeof useTableMutation>[1]
) => {
  const mutation = useTableMutation(table, options);

  return {
    ...mutation,
    update: (
      data: Partial<s.UpdatableForTable<T>>,
      id?: string,
      where?: Record<string, any>
    ) =>
      mutation.mutate({ operation: "update", data, id, where } as Omit<
        UpdateMutationPayload,
        "table"
      >),
  };
};

export const deleteRecord = <T extends TableName>(
  table: T,
  options?: Parameters<typeof useTableMutation>[1]
) => {
  const mutation = useTableMutation(table, options);

  return {
    ...mutation,
    delete: (id?: string, where?: Record<string, any>) =>
      mutation.mutate({ operation: "delete", id, where } as Omit<
        DeleteMutationPayload,
        "table"
      >),
  };
};

// All-in-one hook for convenience
export const useTableCRUD = <T extends TableName>(
  table: T,
  options?: Parameters<typeof useTableMutation>[1]
) => {
  const createMutation = createRecord(table, options);
  const updateMutation = updateRecord(table, options);
  const deleteMutation = deleteRecord(table, options);

  return {
    create: createMutation.create,
    update: updateMutation.update,
    delete: deleteMutation.delete,

    // Status indicators
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,

    // Error states
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,

    // Reset functions
    reset: () => {
      createMutation.reset();
      updateMutation.reset();
      deleteMutation.reset();
    },
  };
};
