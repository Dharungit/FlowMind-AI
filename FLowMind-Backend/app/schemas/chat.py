from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str | None = None
    tool_call_id: str | None = None
    name: str | None = None


class ToolDef(BaseModel):
    type: str = "function"
    function: dict


class ChatRequest(BaseModel):
    model: str | None = None
    messages: list[ChatMessage]
    stream: bool = True
    tools: list[ToolDef] | None = None
    temperature: float | None = None
    max_tokens: int | None = None


class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    choices: list[dict]
    usage: dict | None = None
