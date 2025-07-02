import { Button } from "@/components/ui/button";
import { TextField, TextFieldRoot } from "@/components/ui/textfield";
import { useAuth } from "@/hooks/useAuth";
import { createFileRoute } from "@tanstack/solid-router";
import { createEffect, createSignal, For } from "solid-js";

export const Route = createFileRoute("/(app)/chat")({
  component: RouteComponent,
});

function RouteComponent() {
  const data = useAuth();
  const [socket, setSocket] = createSignal<WebSocket | null>(null);
  const [messages, setMessages] = createSignal<string[]>([]);
  createEffect(() => {
    if (data.data && !socket()) {
      const id = data.data.id;
      const websocketUrl = `wss://99afqhaebh.execute-api.me-central-1.amazonaws.com/production?userId=${id}`;
      console.log("User is authenticated:", id);
      const socket = new WebSocket(websocketUrl);
      socket.onmessage = (event) => {
        console.log("Message from server:", event.data);
        const message = JSON.parse(event.data).message.message;
        setMessages((prev) => [...prev, message]);
      };
      setSocket(socket);
    }
  });
  const sendMessage = (event: Event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const message = form.message.value;
    form.reset();
    console.log("Sending message:", message);
    socket()?.send(JSON.stringify({ action: "sendmessage", message: message }));
  };
  return (
    <div class="flex gap-2">
      <ul>
        <li>Conversation 1</li>
      </ul>

      <div>
        <h2>Chat</h2>
        <ul>
          <For each={messages()}>{(message) => <li>{message}</li>}</For>
        </ul>
        <div>
          <form on:submit={sendMessage}>
            <TextFieldRoot>
              <TextField name="message" placeholder="Type a message..." />
            </TextFieldRoot>
            <Button type="submit">Send</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
