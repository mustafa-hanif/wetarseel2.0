import { Button } from "@/components/ui/button";
import { TextField, TextFieldRoot } from "@/components/ui/textfield";
import Send from "lucide-solid/icons/send";

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (event: Event) => void;
}

export function MessageInput(props: MessageInputProps) {
  return (
    <div class="bg-white border-t border-gray-200 p-4">
      <form onSubmit={props.onSendMessage} class="flex items-center gap-3">
        <div class="flex-1">
          <TextFieldRoot>
            <TextField
              value={props.newMessage}
              onInput={(e) =>
                props.onMessageChange((e.target as HTMLInputElement).value)
              }
              placeholder="Type a message..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </TextFieldRoot>
        </div>
        <Button
          type="submit"
          disabled={!props.newMessage.trim()}
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
