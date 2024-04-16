from functools import cache
from typing import Any, Dict, List

from fastapi import FastAPI

from .models.agents import Agent
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
def get_agent_schema() -> Dict[str, Any]:
    schema = Agent.model_json_schema()
    return schema


@app.post("/models/agents/validate")
def validate_agent_model(agent: Agent) -> None:
    pass
