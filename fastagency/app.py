from functools import cache

from fastapi import FastAPI

from .models.llms import LLMSchemas, get_llm_schemas, get_llm_type, list_llms

app = FastAPI()


@app.get("/models/llms/schemas")
@cache
def models_llms_schemas() -> LLMSchemas:
    return get_llm_schemas()


# @app.get("/models/llms/{model_name}")
# @cache
# def get_schema_for_llm_model(model_name: str) -> Dict[str, Any]:
#     model = get_llm_type(model_name)
#     schema = model.model_json_schema()
#     return schema


for model_name in list_llms():
    LLMType = get_llm_type(model_name)

    @app.post(f"/models/llms/{model_name}/validate")
    def validate_llm_model(llm: LLMType) -> None:  # type: ignore[valid-type]
        pass
