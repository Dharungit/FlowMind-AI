import type { ConversationCreate, ConversationDetailResponse, ConversationResponse, ConversationUpdate } from "./types"

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 300 + Math.random() * 500))

const now = new Date()
const hours = (h: number) => new Date(now.getTime() - h * 3600000).toISOString()

const conversations: ConversationDetailResponse[] = [
  {
    id: "c1a2b3c4-d5e6-7890-abcd-ef1234567890",
    title: "React Server Components explained",
    created_at: hours(48),
    updated_at: hours(2),
    messages: [
      { id: "m1", role: "user", content: "What are React Server Components?", metadata: null, created_at: hours(48) },
      { id: "m2", role: "assistant", content: "React Server Components (RSC) allow components to run on the server...", metadata: null, created_at: hours(48) },
    ],
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    title: "TypeScript utility types",
    created_at: hours(24),
    updated_at: hours(5),
    messages: [
      { id: "m3", role: "user", content: "Show me TypeScript utility types", metadata: null, created_at: hours(24) },
      { id: "m4", role: "assistant", content: "Here are the most useful TypeScript utility types: `Partial<T>`, `Required<T>`...", metadata: null, created_at: hours(24) },
    ],
  },
  {
    id: "d3e4f5a6-b7c8-9012-cdef-123456789012",
    title: "Docker compose networking",
    created_at: hours(12),
    updated_at: hours(8),
    messages: [
      { id: "m5", role: "user", content: "How does Docker compose networking work?", metadata: null, created_at: hours(12) },
      { id: "m6", role: "assistant", content: "Docker Compose creates a default bridge network...", metadata: null, created_at: hours(12) },
    ],
  },
  {
    id: "e4f5a6b7-c8d9-0123-defa-234567890123",
    title: "Next.js App Router migration",
    created_at: hours(72),
    updated_at: hours(20),
    messages: [
      { id: "m7", role: "user", content: "How to migrate from Pages Router to App Router?", metadata: null, created_at: hours(72) },
      { id: "m8", role: "assistant", content: "Migrating from Pages Router to App Router involves several steps...", metadata: null, created_at: hours(71) },
    ],
  },
  {
    id: "f5a6b7c8-d9e0-1234-efab-345678901234",
    title: "Tailwind CSS v4 breaking changes",
    created_at: hours(6),
    updated_at: hours(1),
    messages: [
      { id: "m9", role: "user", content: "What changed in Tailwind CSS v4?", metadata: null, created_at: hours(6) },
      { id: "m10", role: "assistant", content: "Tailwind CSS v4 introduces a CSS-first configuration...", metadata: null, created_at: hours(5) },
    ],
  },
  {
    id: "a6b7c8d9-e0f1-2345-fabc-456789012345",
    title: "Python async best practices",
    created_at: hours(96),
    updated_at: hours(30),
    messages: [
      { id: "m11", role: "user", content: "What are Python async best practices?", metadata: null, created_at: hours(96) },
      { id: "m12", role: "assistant", content: "Here are key async best practices in Python...", metadata: null, created_at: hours(95) },
    ],
  },
  {
    id: "b7c8d9e0-f1a2-3456-abcd-567890123456",
    title: "Git rebase vs merge strategy",
    created_at: hours(4),
    updated_at: hours(3),
    messages: [
      { id: "m13", role: "user", content: "When should I use rebase vs merge?", metadata: null, created_at: hours(4) },
      { id: "m14", role: "assistant", content: "Both rebase and merge have their place...", metadata: null, created_at: hours(4) },
    ],
  },
]

function toConversationResponse(c: ConversationDetailResponse): ConversationResponse {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { messages, ...rest } = c
  return rest
}

export async function getConversations(): Promise<ConversationResponse[]> {
  await delay()
  return conversations
    .map(toConversationResponse)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
}

export async function getConversation(id: string): Promise<ConversationDetailResponse | null> {
  await delay()
  return conversations.find((c) => c.id === id) ?? null
}

export async function createConversation(data: ConversationCreate): Promise<ConversationResponse> {
  await delay()
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const conversation: ConversationDetailResponse = {
    id,
    title: data.title,
    created_at: now,
    updated_at: now,
    messages: [],
  }
  conversations.unshift(conversation)
  return toConversationResponse(conversation)
}

export async function updateConversation(id: string, data: ConversationUpdate): Promise<ConversationResponse | null> {
  await delay()
  const conversation = conversations.find((c) => c.id === id)
  if (!conversation) return null
  conversation.title = data.title
  conversation.updated_at = new Date().toISOString()
  return toConversationResponse(conversation)
}

export async function deleteConversation(id: string): Promise<boolean> {
  await delay()
  const index = conversations.findIndex((c) => c.id === id)
  if (index === -1) return false
  conversations.splice(index, 1)
  return true
}
