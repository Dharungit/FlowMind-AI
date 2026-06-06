import json

from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse, ToolDef


def test_chat_request_minimal():
    req = ChatRequest(messages=[ChatMessage(role="user", content="Hello")])
    assert req.messages[0].role == "user"
    assert req.messages[0].content == "Hello"
    assert req.stream is True


def test_chat_request_with_tools():
    req = ChatRequest(
        messages=[ChatMessage(role="user", content="What's the weather?")],
        tools=[ToolDef(
            type="function",
            function={
                "name": "get_weather",
                "description": "Get weather for a city",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string"}
                    },
                    "required": ["city"]
                }
            }
        )]
    )
    assert len(req.tools) == 1
    assert req.tools[0].function["name"] == "get_weather"


def test_chat_request_model_defaults_none():
    req = ChatRequest(messages=[ChatMessage(role="user", content="Hi")])
    assert req.model is None


def test_chat_response():
    resp = ChatResponse(
        id="chatcmpl-123",
        choices=[{
            "index": 0,
            "message": {"role": "assistant", "content": "Hello!"},
            "finish_reason": "stop"
        }],
        usage={"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
    )
    assert resp.id == "chatcmpl-123"
    assert resp.choices[0]["message"]["content"] == "Hello!"
    assert resp.usage["total_tokens"] == 15


def test_chat_response_json_serializable():
    resp = ChatResponse(
        id="chatcmpl-123",
        choices=[{
            "index": 0,
            "message": {"role": "assistant", "content": "Hi"},
            "finish_reason": "stop"
        }]
    )
    data = json.loads(resp.model_dump_json())
    assert data["object"] == "chat.completion"
