from typing import Literal

__all__ = [
    "OPENAI_MODELS_LITERAL",
    "AZURE_API_VERSIONS_LITERAL",
]
### OpenAI

OPENAI_MODELS_LITERAL = Literal["gpt-4", "gpt-3.5-turbo"]


### Azure OpenAI

AZURE_API_VERSIONS_LITERAL = Literal[
    "2023-05-15",
    "2023-06-01-preview",
    "2023-10-01-preview",
    "2024-02-15-preview",
    "2024-03-01-preview",
    "2024-04-01-preview",
    "2024-05-01-preview",
    "2024-02-01",
]
