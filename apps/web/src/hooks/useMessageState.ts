import { Message } from "@/types/chat";
import { createSignal } from "solid-js";

export function useMessageState() {
  const [newMessage, setNewMessage] = createSignal("");

  const sendMessage = (event: Event) => {
    event.preventDefault();
    if (!newMessage().trim()) return;

    const message: Partial<Message> = {
      id: Date.now().toString(),
      message: newMessage(),
      created: new Date().toISOString(),
      // status: "sent",
      // type: "text",
    };

    // setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  return {
    newMessage,
    setNewMessage,
    sendMessage,
  };
}
