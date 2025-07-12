import { Button } from "@/components/ui/button";
import { TextField, TextFieldRoot } from "@/components/ui/textfield";
import Search from "lucide-solid/icons/search";
import Filter from "lucide-solid/icons/filter";
import MessageCircle from "lucide-solid/icons/message-circle";
import CalendarDays from "lucide-solid/icons/calendar-days";
import ChevronLeft from "lucide-solid/icons/chevron-left";
import ChevronRight from "lucide-solid/icons/chevron-right";
import Tag from "lucide-solid/icons/tag";
import { Show, For } from "solid-js";
import { formatDateRange } from "@/utils/chatUtils";

interface ConversationFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFilterEnabled: boolean;
  onDateFilterToggle: () => void;
  dateWindowStart: Date;
  onDateWindowMove: (direction: "forward" | "backward") => void;
  onDateWindowReset: () => void;
  showUnreadOnly: boolean;
  onUnreadToggle: () => void;
  showTagFilter: boolean;
  onTagFilterToggle: () => void;
  selectedTags: string[];
  allTags: string[];
  onTagToggle: (tag: string) => void;
  onClearTags: () => void;
}

export function ConversationFilters(props: ConversationFiltersProps) {
  return (
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Conversations</h2>

        <div class="flex items-center gap-2">
          {/* Date Filter Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onDateFilterToggle}
            class={`${props.dateFilterEnabled ? "bg-green-100 text-green-600" : ""}`}
            title="Filter by date range"
          >
            <CalendarDays size={16} />
            <Show when={props.dateFilterEnabled}>
              <span class="ml-1 text-xs">Date</span>
            </Show>
          </Button>

          {/* Unread Filter Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onUnreadToggle}
            class={`${props.showUnreadOnly ? "bg-blue-100 text-blue-600" : ""}`}
            title="Show unread conversations only"
          >
            <MessageCircle size={16} />
            <Show when={props.showUnreadOnly}>
              <span class="ml-1 text-xs">Unread</span>
            </Show>
          </Button>

          {/* Tag Filter Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onTagFilterToggle}
            class={`${props.showTagFilter ? "bg-gray-100" : ""} ${props.selectedTags.length > 0 ? "text-blue-600" : ""}`}
            title="Filter by tags"
          >
            <Filter size={16} />
            <Show when={props.selectedTags.length > 0}>
              <span class="ml-1 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {props.selectedTags.length}
              </span>
            </Show>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div class="mt-3 relative">
        <Search
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <TextFieldRoot>
          <TextField
            placeholder="Search conversations..."
            value={props.searchQuery}
            onInput={(e) =>
              props.onSearchChange((e.target as HTMLInputElement).value)
            }
            class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
          />
        </TextFieldRoot>
      </div>

      {/* Date Filter Controls */}
      <Show when={props.dateFilterEnabled}>
        <div class="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div class="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => props.onDateWindowMove("backward")}
              class="text-green-600 hover:bg-green-100"
              title="Previous 2 days"
            >
              <ChevronLeft size={16} />
            </Button>

            <div class="text-center">
              <div class="text-sm font-medium text-green-700">
                {formatDateRange(props.dateWindowStart)}
              </div>
              <div class="text-xs text-green-600">2-day window</div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => props.onDateWindowMove("forward")}
              class="text-green-600 hover:bg-green-100"
              title="Next 2 days"
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          <div class="mt-2 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={props.onDateWindowReset}
              class="text-xs text-green-600 hover:bg-green-100"
            >
              Reset to Today
            </Button>
          </div>
        </div>
      </Show>

      {/* Tag Filter Dropdown */}
      <Show when={props.showTagFilter}>
        <div class="mt-3 p-3 bg-gray-50 rounded-lg border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">
              Filter by Tags
            </span>
            <Show when={props.selectedTags.length > 0}>
              <Button
                variant="ghost"
                size="sm"
                onClick={props.onClearTags}
                class="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear All
              </Button>
            </Show>
          </div>

          <div class="flex flex-wrap gap-2">
            <For each={props.allTags}>
              {(tag) => (
                <button
                  onClick={() => props.onTagToggle(tag)}
                  class={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                    props.selectedTags.includes(tag)
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <Tag size={10} />
                  {tag}
                </button>
              )}
            </For>
          </div>

          <Show when={props.allTags.length === 0}>
            <p class="text-xs text-gray-500 text-center py-2">
              No tags available
            </p>
          </Show>
        </div>
      </Show>
    </div>
  );
}
