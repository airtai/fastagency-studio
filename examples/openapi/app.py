from typing import Annotated, Union

from fastapi import FastAPI, Request
from pydantic import BaseModel, Field


class Item(BaseModel):
    name: Annotated[str, Field(..., description="Name of the item")]
    description: Annotated[Union[str, None], Field(..., description="Description of the item")]
    price: Annotated[float, Field(..., description="Price of the item")]
    tax: Annotated[Union[float, None], Field(..., description="Tax of the item")]


app = FastAPI(servers=[
        {"url": "http://localhost:8080", "description": "Local environment"},
    ],)


@app.put("/items/{item_id}/ships/{ship}")
async def update_item(item_id: int, ship: str, item: Item, q1: Union[str, None] = None, q2: Union[int, None] = None):
    result = {"item_id": item_id, "ships": ship, **item.dict(), "q1": q1, "q2": q2}
    if q1:
        result.update({"q1": q1})
    if q2:
        result.update({"q2": q2})
    return result
