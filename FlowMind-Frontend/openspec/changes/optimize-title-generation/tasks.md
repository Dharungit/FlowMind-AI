## 1. Type changes

- [ ] 1.1 Add `title_generated: boolean` to `ConversationResponse` interface in `types.ts`

## 2. API client

- [ ] 2.1 Add `generateTitle(id: string)` method to `conversation-client.ts` calling `POST /v1/conversations/:id/generate-title`

## 3. Mutation hook

- [ ] 3.1 Create `useGenerateTitle()` mutation in `useConversations.ts` with `retry: 3` and exponential backoff
- [ ] 3.2 On `onSuccess`: update single-conversation cache via `setQueryData` and invalidate list
- [ ] 3.3 On `onError`: show Sonner error toast and fallback `invalidateQueries`

## 4. Wire into stream handler

- [ ] 4.1 Replace eager list invalidation in `useStreamMessage.ts` `"done"` handler with `useGenerateTitle().mutate(conversation_id)`
- [ ] 4.2 Import `useGenerateTitle` hook into `useStreamMessage.ts`

## 5. Verify

- [ ] 5.1 Run TypeScript compilation check
- [ ] 5.2 Run lint check
- [ ] 5.3 Run `openspec validate optimize-title-generation --type change --strict`
