# Unified Mutation System

This system provides a robust, type-safe way to perform CRUD operations on any table using TanStack Query and your existing backend architecture.

## Features

- **Type Safety**: Full TypeScript support with Zapatos schema types
- **Account Isolation**: Automatic account_id enforcement for security
- **TanStack Query Integration**: Automatic cache invalidation and optimistic updates
- **Flexible Operations**: Create, update, and delete with various conditions
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Built-in loading states for UI feedback

## Backend API

The mutations endpoint (`/api/mutations/**`) supports:

- **POST** `/api/mutations/:table` - Create records
- **PUT** `/api/mutations/:table` - Update records
- **DELETE** `/api/mutations/:table/:id` - Delete by ID
- **DELETE** `/api/mutations/:table` - Delete by conditions

All operations automatically include account isolation using the authenticated user's account ID.

## Frontend Usage

### 1. Basic CRUD Hook

The `useTableCRUD` hook provides all CRUD operations for a table:

```typescript
import { useTableCRUD } from "@/hooks/useMutations";
import { dbquery } from "@/lib/useQueryTable";

function UserManager() {
  // Get data with your existing query system
  const usersQuery = dbquery("users");

  // Set up CRUD operations
  const userCRUD = useTableCRUD("users", {
    onSuccess: (data, variables) => {
      console.log(`${variables.operation} successful:`, data);
    },
    onError: (error) => {
      console.error("Mutation failed:", error.message);
    },
  });

  return (
    <div>
      {/* Create */}
      <button onClick={() => userCRUD.create({
        name: "John Doe",
        email: "john@example.com"
      })}>
        {userCRUD.isCreating ? "Creating..." : "Create User"}
      </button>

      {/* Update */}
      <button onClick={() => userCRUD.update({ name: "Jane" }, "user-123")}>
        {userCRUD.isUpdating ? "Updating..." : "Update User"}
      </button>

      {/* Delete */}
      <button onClick={() => userCRUD.delete("user-123")}>
        {userCRUD.isDeleting ? "Deleting..." : "Delete User"}
      </button>

      {/* Error handling */}
      {userCRUD.createError && <p>Error: {userCRUD.createError.message}</p>}
    </div>
  );
}
```

### 2. Individual Operation Functions

For more granular control, use individual functions:

```typescript
import { createRecord, updateRecord, deleteRecord } from "@/hooks/useMutations";

function Component() {
  const createUser = createRecord("users");
  const updateUser = updateRecord("users");
  const deleteUser = deleteRecord("users");

  return (
    <div>
      <button onClick={() => createUser.create({ name: "John" })}>
        Create
      </button>
      <button onClick={() => updateUser.update({ name: "Jane" }, "user-123")}>
        Update
      </button>
      <button onClick={() => deleteUser.delete("user-123")}>
        Delete
      </button>
    </div>
  );
}
```

### 3. Advanced Operations

#### Update with WHERE conditions:

```typescript
userCRUD.update(
  { status: "active" },
  undefined, // no specific ID
  { role: "admin" } // WHERE role = 'admin'
);
```

#### Delete with WHERE conditions:

```typescript
userCRUD.delete(
  undefined, // no specific ID
  { status: "inactive" } // WHERE status = 'inactive'
);
```

### 4. Loading States

The system provides comprehensive loading states:

```typescript
const userCRUD = useTableCRUD("users");

// Individual operation states
userCRUD.isCreating; // true when creating
userCRUD.isUpdating; // true when updating
userCRUD.isDeleting; // true when deleting
userCRUD.isLoading; // true when any operation is pending

// Error states
userCRUD.createError; // error from create operation
userCRUD.updateError; // error from update operation
userCRUD.deleteError; // error from delete operation
```

### 5. Cache Management

The system automatically:

- Invalidates table queries after mutations
- Invalidates expanded queries that include the table
- Refetches data to show latest state

You can disable auto-invalidation:

```typescript
const userCRUD = useTableCRUD("users", {
  invalidateQueries: false, // Manual cache control
});
```

## API Payload Examples

### Create Operation

```javascript
// POST /api/mutations/users
{
  "operation": "create",
  "table": "users",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Update Operation

```javascript
// PUT /api/mutations/users
{
  "operation": "update",
  "table": "users",
  "data": {
    "name": "Jane Doe"
  },
  "id": "user-123"
}
```

### Delete Operation

```javascript
// DELETE /api/mutations/users/user-123
// (no body needed for ID-based deletes)

// OR with conditions:
// DELETE /api/mutations/users
{
  "operation": "delete",
  "table": "users",
  "where": {
    "status": "inactive"
  }
}
```

## Type Safety

The system leverages your existing Zapatos types:

```typescript
// Fully typed based on your database schema
const userCRUD = useTableCRUD("users");

// TypeScript knows the exact shape of user data
userCRUD.create({
  name: "John", // ✅ Required field
  email: "john@...", // ✅ Required field
  invalidField: 1, // ❌ TypeScript error
});
```

## Error Handling

Errors are automatically caught and provided through the hook:

```typescript
const userCRUD = useTableCRUD("users", {
  onError: (error, variables) => {
    // Global error handling
    console.error(`${variables.operation} failed:`, error.message);

    // Could show toast notifications, etc.
  }
});

// Or handle errors per component
if (userCRUD.createError) {
  return <div>Error: {userCRUD.createError.message}</div>;
}
```

## Security

- All operations are automatically scoped to the authenticated user's account
- Account ID is enforced on the backend for all CRUD operations
- Unauthorized requests return 401 status
- Table name validation prevents SQL injection

## Best Practices

1. **Use the CRUD hook for simple components** that need all operations
2. **Use individual hooks for specialized components** that only need specific operations
3. **Handle loading states** to provide good UX
4. **Implement error boundaries** for graceful error handling
5. **Use optimistic updates** when appropriate
6. **Batch operations** when possible to reduce API calls

See `ExampleCRUD.tsx` for complete implementation examples.
