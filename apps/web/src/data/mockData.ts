import { Team, Agent, Conversation } from "@/types/chat";

// Mock data
export const mockTeams: Team[] = [
  { id: "1", name: "Sales Team", conversationCount: 12 },
  { id: "2", name: "Support Team", conversationCount: 8 },
  { id: "3", name: "Marketing Team", conversationCount: 5 },
];

export const mockAgents: Agent[] = [
  { id: "1", name: "John Doe", conversationCount: 7 },
  { id: "2", name: "Jane Smith", conversationCount: 5 },
  { id: "3", name: "Mike Johnson", conversationCount: 3 },
];

export const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Ahmed Al-Rashid",
    phone: "+966501234567",
    lastMessage: "Thank you for your help!",
    timestamp: "2024-01-20T14:30:00Z",
    unreadCount: 2,
    tags: ["VIP", "Sales"],
    assignedAgent: "1",
    teamId: "1",
    email: "ahmed.rashid@example.com",
    company: "Al-Rashid Trading Co.",
    location: "Riyadh, Saudi Arabia",
    notes: "High-value customer, prefers phone calls over messages.",
    createdAt: "2024-01-15T10:00:00Z",
    lastActivity: "2024-01-20T14:30:00Z",
  },
  {
    id: "2",
    name: "Fatima Hassan",
    phone: "+966507654321",
    lastMessage: "When will my order arrive?",
    timestamp: "2024-01-20T13:15:00Z",
    unreadCount: 0,
    tags: ["Support"],
    assignedAgent: "2",
    teamId: "2",
    email: "fatima.hassan@gmail.com",
    company: "Hassan Enterprises",
    location: "Jeddah, Saudi Arabia",
    notes: "Regular customer, usually orders monthly supplies.",
    createdAt: "2024-01-10T09:00:00Z",
    lastActivity: "2024-01-20T13:15:00Z",
  },
  {
    id: "3",
    name: "Omar Khalil",
    phone: "+966509876543",
    lastMessage: "I'm interested in your services",
    timestamp: "2024-01-20T12:45:00Z",
    unreadCount: 1,
    tags: ["Lead"],
    teamId: "1",
    email: "omar.khalil@business.com",
    company: "Khalil Industries",
    location: "Dammam, Saudi Arabia",
    notes: "New lead from website contact form. Interested in bulk orders.",
    createdAt: "2024-01-20T12:00:00Z",
    lastActivity: "2024-01-20T12:45:00Z",
  },
];

export const mockMessages = [
  {
    id: "1",
    text: "Hello! I'm interested in your services",
    timestamp: "2024-01-20T14:25:00Z",
    isOutgoing: false,
    status: "read" as const,
    type: "text" as const,
  },
  {
    id: "2",
    text: "Hi! Thank you for reaching out. How can I help you today?",
    timestamp: "2024-01-20T14:26:00Z",
    isOutgoing: true,
    status: "read" as const,
    type: "text" as const,
  },
  {
    id: "3",
    text: "I need more information about your pricing",
    timestamp: "2024-01-20T14:28:00Z",
    isOutgoing: false,
    status: "read" as const,
    type: "text" as const,
  },
  {
    id: "4",
    text: "Of course! I'll send you our pricing details right away.",
    timestamp: "2024-01-20T14:29:00Z",
    isOutgoing: true,
    status: "delivered" as const,
    type: "text" as const,
  },
  {
    id: "5",
    text: "Thank you for your help!",
    timestamp: "2024-01-20T14:30:00Z",
    isOutgoing: false,
    status: "read" as const,
    type: "text" as const,
  },
];
