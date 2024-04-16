from functools import cache
from typing import Any, Dict, List

from fastapi import FastAPI

from .models.llms import get_llm, list_llms

app = FastAPI()


@app.get("/models/llms/")
@cache
def list_llms_models() -> List[str]:
    return list_llms()


@app.get("/models/llms/{model_name}")
@cache
def get_schema_for_llm_model(model_name: str) -> Dict[str, Any]:
    model = get_llm(model_name)
    schema = model.model_json_schema()
    return schema
