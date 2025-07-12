// Chat-related type definitions
export interface Message {
  id: string;
  text: string;
  timestamp: string;
  isOutgoing: boolean;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "document";
}

export interface Conversation {
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
}

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
