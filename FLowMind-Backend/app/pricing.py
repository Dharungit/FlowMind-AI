MODEL_PRICING: dict[str, dict[str, float]] = {
   "deepseek-chat": {
        "input_cost_per_1m": 0.14,
        "input_cache_hit_cost_per_1m": 0.0028,
        "output_cost_per_1m": 0.28
    },
    "text-embedding-3-small": {
        "input_cost_per_1m": 0.02,
        "input_cache_hit_cost_per_1m": 0.02,
        "output_cost_per_1m": 0.0
    }
}


def calculate_cost(
    model: str,
    input_tokens: int,
    output_tokens: int,
    cached_input_tokens: int = 0,
) -> float:
    pricing = MODEL_PRICING.get(model)
    if pricing is None:
        return 0.0

    non_cached_input = max(0, input_tokens - cached_input_tokens)
    non_cached_input_cost = (non_cached_input / 1_000_000) * pricing["input_cost_per_1m"]
    cached_input_cost = (cached_input_tokens / 1_000_000) * pricing.get("input_cache_hit_cost_per_1m", 0)
    output_cost = (output_tokens / 1_000_000) * pricing["output_cost_per_1m"]
    return round(non_cached_input_cost + cached_input_cost + output_cost, 6)
