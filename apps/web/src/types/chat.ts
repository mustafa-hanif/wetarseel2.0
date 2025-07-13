import { conversations, leads, messages } from "zapatos/schema";

export interface Conversation extends conversations.Selectable {
  leads: leads.Selectable;
  messages: messages.Selectable;
}

// Chat-related type definitions
export type Message = messages.Selectable;

/* export interface Conversation {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar?: string;
  tags: string[];
  assignedAgent?: string;
  teamId?: string;
  email?: string;
  company?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  lastActivity: string;
} */

export interface Team {
  id: string;
  name: string;
  conversationCount: number;
}

export interface Agent {
  id: string;
  name: string;
  conversationCount: number;
}
