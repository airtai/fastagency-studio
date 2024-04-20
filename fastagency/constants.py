from typing import Literal

__all__ = [
    "OPENAI_MODELS_LITERAL",
    "AZURE_API_VERSIONS_LITERAL",
    "REGISTRED_MODEL_TYPES",
]


REGISTRED_MODEL_TYPES = Literal["llm", "agent", "team"]
## LLMS

### OpenAI

OPENAI_MODELS_LITERAL = Literal["gpt-4", "gpt-3.5-turbo"]


### Azure OpenAI

AZURE_API_VERSIONS_LITERAL = Literal["2024-02-15-preview", "latest"]