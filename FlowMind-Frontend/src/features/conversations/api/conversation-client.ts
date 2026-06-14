import { apiClient } from "@/features/auth/api/auth-client"
import type {
  ConversationCreate,
  ConversationResponse,
  ConversationDetailResponse,
  ConversationUpdate,
  MessageAddRequest,
  MessageResponse,
} from "../types"

class ConversationApiClient {
  list(): Promise<ConversationResponse[]> {
    return apiClient.get<ConversationResponse[]>("/v1/conversations")
  }

  get(id: string): Promise<ConversationDetailResponse> {
    return apiClient.get<ConversationDetailResponse>(`/v1/conversations/${id}`)
  }

  create(title?: string): Promise<ConversationResponse> {
    const body: ConversationCreate = { title: title || "New Conversation" }
    return apiClient.post<ConversationResponse>("/v1/conversations", body)
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

  sendMessage(conversationId: string, messages: MessageAddRequest): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(
      `/v1/conversations/${conversationId}/messages`,
      messages,
    )
  }
}

export const conversationClient = new ConversationApiClient()
