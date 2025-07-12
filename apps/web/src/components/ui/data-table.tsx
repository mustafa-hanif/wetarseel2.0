import { createSignal, For, Show, createMemo } from "solid-js";
import {
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/solid-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TextField, TextFieldRoot } from "@/components/ui/textfield";
import ArrowUpDown from "lucide-solid/icons/arrow-up-down";
import ChevronLeft from "lucide-solid/icons/chevron-left";
import ChevronRight from "lucide-solid/icons/chevron-right";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  enablePagination?: boolean;
  pageSize?: number;
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = createSignal<SortingState>([]);
  const [columnFilters, setColumnFilters] = createSignal<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = createSignal<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = createSignal("");

  const table = createMemo(() =>
    createSolidTable({
      get data() {
        return props.data;
      },
      get columns() {
        return props.columns;
      },
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: props.enablePagination ? getPaginationRowModel() : undefined,
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onGlobalFilterChange: setGlobalFilter,
      get state() {
        return {
          sorting: sorting(),
          columnFilters: columnFilters(),
          columnVisibility: columnVisibility(),
          globalFilter: globalFilter(),
        };
      },
      initialState: {
        pagination: {
          pageSize: props.pageSize || 10,
        },
      },
    })
  );

  return (
    <div class="space-y-4">
      {/* Search Input */}
      <Show when={props.searchKey || props.searchPlaceholder}>
        <div class="flex items-center py-4">
          <TextFieldRoot class="max-w-sm">
            <TextField
              placeholder={props.searchPlaceholder || "Search..."}
              value={globalFilter()}
              onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)}
              class="max-w-sm"
            />
          </TextFieldRoot>
        </div>
      </Show>

      {/* Table */}
      <Card>
        <CardContent class="p-0">
          <div class="rounded-md border">
            <table class="w-full">
              <thead>
                <For each={table().getHeaderGroups()}>
                  {(headerGroup) => (
                    <tr class="border-b bg-muted/50">
                      <For each={headerGroup.headers}>
                        {(header) => (
                          <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Show
                              when={!header.isPlaceholder}
                              fallback={null}
                            >
                              <div
                                class={
                                  header.column.getCanSort()
                                    ? "cursor-pointer select-none flex items-center space-x-2"
                                    : ""
                                }
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                <Show when={header.column.getCanSort()}>
                                  <ArrowUpDown class="ml-2 h-4 w-4" />
                                </Show>
                              </div>
                            </Show>
                          </th>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </thead>
              <tbody>
                <Show
                  when={table().getRowModel().rows?.length}
                  fallback={
                    <tr>
                      <td
                        colSpan={props.columns.length}
                        class="h-24 text-center"
                      >
                        No results.
                      </td>
                    </tr>
                  }
                >
                  <For each={table().getRowModel().rows}>
                    {(row) => (
                      <tr
                        class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        data-state={row.getIsSelected() && "selected"}
                      >
                        <For each={row.getVisibleCells()}>
                          {(cell) => (
                            <td class="p-4 align-middle">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          )}
                        </For>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Show when={props.enablePagination}>
        <div class="flex items-center justify-between space-x-2 py-4">
          <div class="flex-1 text-sm text-muted-foreground">
            {table().getFilteredSelectedRowModel().rows.length} of{" "}
            {table().getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div class="flex items-center space-x-2">
            <div class="flex items-center space-x-2">
              <p class="text-sm font-medium">Rows per page</p>
              <select
                class="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
                value={table().getState().pagination.pageSize}
                onChange={(e) => {
                  table().setPageSize(Number((e.target as HTMLSelectElement).value));
                }}
              >
                <For each={[10, 20, 30, 40, 50]}>
                  {(pageSize) => (
                    <option value={pageSize}>{pageSize}</option>
                  )}
                </For>
              </select>
            </div>
            <div class="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table().getState().pagination.pageIndex + 1} of{" "}
              {table().getPageCount()}
            </div>
            <div class="flex items-center space-x-2">
              <Button
                variant="outline"
                class="h-8 w-8 p-0"
                onClick={() => table().previousPage()}
                disabled={!table().getCanPreviousPage()}
              >
                <span class="sr-only">Go to previous page</span>
                <ChevronLeft class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                class="h-8 w-8 p-0"
                onClick={() => table().nextPage()}
                disabled={!table().getCanNextPage()}
              >
                <span class="sr-only">Go to next page</span>
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
