import { apiClient } from "@/features/auth/api/auth-client"
import type {
  ConversationResponse,
  ConversationDetailResponse,
  ConversationUpdate,
  MessageResponse,
  StreamRequest,
  SSEEvent,
  StreamMetaEvent,
  StreamErrorEvent,
  StreamDoneEvent,
  StreamChunkEvent,
} from "../types"

class ConversationApiClient {
  list(): Promise<ConversationResponse[]> {
    return apiClient.get<ConversationResponse[]>("/v1/conversations")
  }

  get(id: string): Promise<ConversationDetailResponse> {
    return apiClient.get<ConversationDetailResponse>(`/v1/conversations/${id}`)
  }

  update(id: string, title: string): Promise<ConversationResponse> {
    const body: ConversationUpdate = { title }
    return apiClient.put<ConversationResponse>(`/v1/conversations/${id}`, body)
  }

  delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/conversations/${id}`)
  }

  deleteMessage(messageId: string): Promise<void> {
    return apiClient.delete<void>(`/v1/messages/${messageId}`)
  }

  streamMessage(body: StreamRequest, signal?: AbortSignal): Promise<Response> {
    return apiClient.stream("/v1/stream", body, signal)
  }
}

export async function* parseSSEResponse(response: Response): AsyncGenerator<SSEEvent> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error("Response body is not readable")

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue

        const jsonStr = trimmed.slice(6)
        try {
          const data = JSON.parse(jsonStr)

          if (data.type === "meta") {
            yield { type: "meta", conversation_id: data.conversation_id } as StreamMetaEvent
          } else if (data.type === "error") {
            yield {
              type: "error",
              error: data.error,
              conversation_id: data.conversation_id,
              message: data.message,
            } as StreamErrorEvent
          } else if (data.done === true) {
            yield {
              type: "done",
              done: true,
              conversation_id: data.conversation_id,
              message: data.message,
            } as StreamDoneEvent
          } else {
            yield { type: "chunk", data } as StreamChunkEvent
          }
        } catch {
          console.warn("Failed to parse SSE JSON:", jsonStr)
        }
      }
    }

    const remaining = buffer.trim()
    if (remaining && remaining.startsWith("data: ")) {
      const jsonStr = remaining.slice(6)
      try {
        const data = JSON.parse(jsonStr)
        if (data.done === true) {
          yield {
            type: "done",
            done: true,
            conversation_id: data.conversation_id,
            message: data.message,
          } as StreamDoneEvent
        }
      } catch {
        console.warn("Failed to parse trailing SSE JSON:", jsonStr)
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export const conversationClient = new ConversationApiClient()
