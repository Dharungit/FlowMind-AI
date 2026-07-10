# FlowMind Chat

AI chat interface built with Next.js 16 (App Router), shadcn/ui, and Tailwind CSS.

## Getting Started

```bash
cp .env.example .env.local  # then fill in required values
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Backend API base URL |
| `AUTH_SECRET` | Yes | NextAuth secret |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |

## Folder Structure

```
flowmind-web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # Google sign-in page
│   │   │   └── layout.tsx              # Auth route layout
│   │   ├── (chat)/
│   │   │   ├── c/
│   │   │   │   └── [chatId]/           # Future chat detail route
│   │   │   ├── layout.tsx              # Wraps with ChatProvider
│   │   │   └── page.tsx                # Chat landing page
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/     # NextAuth API route
│   │   ├── layout.tsx                  # Root layout, wraps AppProvider > AuthProvider > UIProvider
│   │   ├── loading.tsx                 # Global loading state
│   │   ├── error.tsx                   # Global error boundary
│   │   └── globals.css                 # Tailwind + shadcn styles
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives (button, textarea, popover, hover-card)
│   │   ├── chat/
│   │   │   ├── assistant-message.tsx
│   │   │   ├── chat-input.tsx
│   │   │   ├── markdown-renderer.tsx
│   │   │   ├── message-thread.tsx
│   │   │   └── user-message.tsx
│   │   ├── layout/
│   │   │   └── Header.tsx              # App header with logo + user menu
│   │   └── shared/
│   │       ├── Avatar.tsx              # User avatar component
│   │       ├── Spinner.tsx             # Loading spinner
│   │       └── ErrorBoundary.tsx       # React error boundary
│   │
│   ├── store/                          # Context + useReducer state management
│   │   ├── app/
│   │   │   ├── AppContext.tsx          # AppProvider + useApp()
│   │   │   ├── appReducer.ts
│   │   │   └── appTypes.ts
│   │   ├── chat/
│   │   │   ├── ChatContext.tsx         # ChatProvider + useChatState()
│   │   │   ├── chatActions.ts          # Action creator helpers
│   │   │   ├── chatReducer.ts
│   │   │   └── chatTypes.ts
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx         # AuthProvider + useAuth()
│   │   │   └── authTypes.ts
│   │   └── ui/
│   │       ├── UIContext.tsx           # UIProvider + useUI()
│   │       └── uiReducer.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   ├── auth-client.ts      # Core API client (fetch wrapper)
│   │   │   │   ├── auth.ts             # NextAuth configuration
│   │   │   │   └── types.ts            # Auth API types
│   │   │   ├── components/
│   │   │   │   ├── auth-guard.tsx
│   │   │   │   ├── providers.tsx       # SessionProvider + QueryClient
│   │   │   │   └── user-menu.tsx
│   │   │   └── hooks/
│   │   │       └── use-auth.ts         # React Query hooks
│   │   └── chat/
│   │       ├── api/
│   │       │   └── chat-client.ts      # Streaming chat API
│   │       └── hooks/
│   │           └── use-chat.ts         # Chat hook (consumes ChatContext)
│   │
│   ├── hooks/                          # shadcn/ui hook alias target
│   ├── lib/
│   │   └── utils.ts                    # cn() classnames helper
│   ├── config/
│   │   └── env.ts                      # Typed environment variables
│   └── proxy.ts                        # Auth route guard middleware
│
├── public/                             # Static assets
├── next.config.ts
├── tsconfig.json
├── components.json                     # shadcn/ui configuration
├── .env.example
└── package.json
```

## Architecture Decisions

- **[ADR-0001](adr/0001-use-shadcn-ui-and-tailwind-css.md)**: shadcn/ui + Tailwind CSS for UI components
- **[ADR-0002](adr/0002-use-native-fetch-for-streaming.md)**: Native fetch + ReadableStream for chat streaming

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
