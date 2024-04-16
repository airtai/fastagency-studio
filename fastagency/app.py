from functools import cache
from typing import Any, Dict, List

from fastapi import FastAPI

from .models.agents import get_agent_type, list_agents
from .models.llms import get_llm_type, list_llms

app = FastAPI()


@app.get("/models/llms/")
@cache
def list_llms_models() -> List[str]:
    return list_llms()


@app.get("/models/llms/{model_name}")
@cache
def get_schema_for_llm_model(model_name: str) -> Dict[str, Any]:
    model = get_llm_type(model_name)
    schema = model.model_json_schema()
    return schema


for model_name in list_llms():
    LLMType = get_llm_type(model_name)

    @app.post(f"/models/llms/{model_name}/validate")
    def validate_llm_model(llm: LLMType) -> None:  # type: ignore[valid-type]
        pass


@app.get("/models/agents/")
@cache
def list_agent_models() -> List[str]:
    return list_agents()


@app.get("/models/agents/{agent_name}")
@cache
def get_agent_schema(agent_name: str) -> Dict[str, Any]:
    model = get_agent_type(agent_name)
    schema = model.model_json_schema()

    return schema


for agent_name in list_agents():
    AgentType = get_agent_type(agent_name)

    @app.post(f"/models/agents/{agent_name}/validate")
    def validate_agent_model(agent: AgentType) -> None:  # type: ignore[valid-type]
        pass
