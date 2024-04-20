import json
from functools import cache
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from pydantic import ValidationError

# from .models.agents.agents import get_agent_type, list_agents
from .models import Registry, Schemas

app = FastAPI()


@app.get("/models/llms/schemas")
@cache
def models_llms_schemas() -> Schemas:
    return Registry.get_default().get_schemas("llm")


@app.post("/models/llms/{model_name}/validate")
def validate_llm_model(model_name: str, llm: Dict[str, Any]) -> None:
    try:
        Registry.get_default().validate("llm", llm, model_name)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=json.loads(e.json())) from e
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"error": f"{model_name} is not a valid model name."},
        ) from e


@app.get("/models/agents/")
@cache
def list_agent_models() -> List[str]:
    raise NotImplementedError("This endpoint is not implemented yet.")
    # return list_agents()


@app.get("/models/agents/{agent_name}")
@cache
def get_agent_schema(agent_name: str) -> Dict[str, Any]:
    raise NotImplementedError("This endpoint is not implemented yet.")
    # model = get_agent_type(agent_name)
    # schema = model.model_json_schema()

    # return schema


# for agent_name in list_agents():
#     AgentType = get_agent_type(agent_name)

#     @app.post(f"/models/agents/{agent_name}/validate")
#     def validate_agent_model(agent: AgentType) -> None:  # type: ignore[valid-type]
#         pass
