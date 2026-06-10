interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  model: string;
  messages: Message[];
  stream: boolean;
  temperature?: number;
}

interface ChatOptions {
  onToken?: (token: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }
  return url;
}

export async function sendMessage(
  messages: Message[],
  options: ChatOptions = {},
): Promise<string | null> {
  const { onToken, onDone, onError, signal } = options;

  const url = getBackendUrl();

  const fullUrl = `${url}/v1/chat/completions`;

  const body: ChatRequest = {
    model: "deepseek-chat",
    messages,
    stream: true,
    temperature: 0.7,
  };

  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is empty — streaming not supported");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const token =
              parsed.choices?.[0]?.delta?.content ||
              parsed.choices?.[0]?.text ||
              "";
            if (token) {
              fullContent += token;
              onToken?.(token);
            }
          } catch {
            if (data.trim()) {
              fullContent += data;
              onToken?.(data);
            }
          }
        }
      }
    }

    onDone?.();
    return fullContent;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      onDone?.();
      return null;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

export async function sendMessageNonStreaming(
  messages: Message[],
): Promise<string> {
  const url = getBackendUrl();

  const body: ChatRequest = {
    model: "deepseek-chat",
    messages,
    stream: false,
    temperature: 0.7,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content || data.content || JSON.stringify(data)
  );
}
