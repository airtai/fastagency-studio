from typing import Annotated, Union

from pydantic import Field

from ..base import Model
from ..llms.azure import AzureOAIAPIKeyRef
from ..llms.openai import OpenAIAPIKeyRef

__all__ = ["AgentBaseModel"]

# todo: this should be a mixin


class AgentBaseModel(Model):
    name: Annotated[str, Field(description="The name of the agent")]
    llm: Annotated[
        Union[OpenAIAPIKeyRef, AzureOAIAPIKeyRef],
        Field(
            title="LLM",
            description="LLM used by the agent for producing responses",
        ),
    ]
