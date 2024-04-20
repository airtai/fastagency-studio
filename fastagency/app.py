import json
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import ValidationError

from .constants import REGISTRED_MODEL_TYPES

# from .models.agents.agents import get_agent_type, list_agents
from .models import Registry, Schemas

app = FastAPI()


@app.get("/models/schemas")
async def get_models_schemas() -> Schemas:
    schemas = Registry.get_default().get_schemas()
    return schemas


@app.post("/models/{type}s/{model_name}/validate")
async def validate_model(
    type: REGISTRED_MODEL_TYPES, model_name: str, model: Dict[str, Any]
) -> None:
    try:
        Registry.get_default().validate(type, model, model_name)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=json.loads(e.json())) from e
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"error": f"{model_name} is not a valid model name."},
        ) from e


# @app.get("/models/agents/")
# @cache
# def list_agent_models() -> List[str]:
#     raise NotImplementedError("This endpoint is not implemented yet.")
#     # return list_agents()


# @app.get("/models/agents/{agent_name}")
# @cache
# def get_agent_schema(agent_name: str) -> Dict[str, Any]:
#     raise NotImplementedError("This endpoint is not implemented yet.")
# model = get_agent_type(agent_name)
# schema = model.model_json_schema()

# return schema


# for agent_name in list_agents():
#     AgentType = get_agent_type(agent_name)

#     @app.post(f"/models/agents/{agent_name}/validate")
#     def validate_agent_model(agent: AgentType) -> None:  # type: ignore[valid-type]
#         pass
