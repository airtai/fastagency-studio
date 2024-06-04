from typing import Annotated, Dict, List, Optional, Union
from uuid import UUID

from pydantic import Field
from typing_extensions import TypeAlias

from ...db.helpers import find_model_using_raw
from ..base import Model
from ..registry import Registry
from ..toolboxes.toolbox import FunctionInfo, ToolboxRef

__all__ = ["AgentBaseModel"]

# Agents can work with any LLM, so we construct a union of all LLM references
llm_type_refs: TypeAlias = Union[  # type: ignore[valid-type]
    tuple(Registry.get_default().get_models_refs_by_type("llm"))
]


class AgentBaseModel(Model):
    llm: Annotated[
        llm_type_refs,
        Field(
            title="LLM",
            description="LLM used by the agent for producing responses",
        ),
    ]

    toolbox_1: Annotated[
        Optional[ToolboxRef],
        Field(
            title="Toolbox",
            description="Toolbox used by the agent for producing responses",
        ),
    ] = None

    toolbox_2: Annotated[
        Optional[ToolboxRef],
        Field(
            title="Toolbox",
            description="Toolbox used by the agent for producing responses",
        ),
    ] = None

    toolbox_3: Annotated[
        Optional[ToolboxRef],
        Field(
            title="Toolbox",
            description="Toolbox used by the agent for producing responses",
        ),
    ] = None

    async def get_clients_from_toolboxes(
        self, user_id: UUID
    ) -> Dict[str, List[FunctionInfo]]:
        clients: Dict[str, List[FunctionInfo]] = {}
        for i in range(3):
            toolbox_property = getattr(self, f"toolbox_{i+1}")
            if toolbox_property is None:
                continue

            toolbox_dict = await find_model_using_raw(toolbox_property.uuid)
            toolbox_model = toolbox_property.get_data_model()(
                **toolbox_dict["json_str"]
            )
            client = await toolbox_model.create_autogen(toolbox_property.uuid, user_id)
            clients[f"client_{i+1}"] = client
        return clients

    async def get_functions_from_toolboxes(self, user_id: UUID) -> List[FunctionInfo]:
        clients = await self.get_clients_from_toolboxes(user_id)
        functions = [x for _, xs in clients.items() for x in xs]

        return functions
