from typing import Annotated, Optional, Tuple
from uuid import UUID

import httpx
from pydantic import AfterValidator, Field, HttpUrl
from typing_extensions import TypeAlias

from ...openapi.client import Client
from ..base import Model
from ..registry import Registry

# Pydantic adds trailing slash automatically to URLs, so we need to remove it
# https://github.com/pydantic/pydantic/issues/7186#issuecomment-1691594032
URL = Annotated[HttpUrl, AfterValidator(lambda x: str(x).rstrip("/"))]

__all__ = [
    "OpenAPIAuth",
    "Toolbox",
]


@Registry.get_default().register("secret")
class OpenAPIAuth(Model):
    username: Annotated[
        str,
        Field(
            description="username for openapi routes authentication",
        ),
    ]
    password: Annotated[
        str,
        Field(
            description="password for openapi routes authentication",
        ),
    ]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> Tuple[str, str]:
        my_model = await cls.from_db(model_id)

        return my_model.username, my_model.password


OpenAPIAuthRef: TypeAlias = OpenAPIAuth.get_reference_model()  # type: ignore[valid-type]


@Registry.get_default().register("toolbox")
class Toolbox(Model):
    openapi_url: Annotated[
        URL,
        Field(
            title="openapi url",
            description="URL of openapi spec file",
        ),
    ]
    openapi_auth: Annotated[
        Optional[OpenAPIAuthRef],
        Field(
            title="openapi auth",
            description="Authentication info for the api mentioned in openapi spec",
        ),
    ] = None

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> Client:
        my_model = await cls.from_db(model_id)

        # Download openapi spec to tmp file
        with httpx.Client() as httpx_client:
            response = httpx_client.get(my_model.openapi_url)  # type: ignore[arg-type]
            response.raise_for_status()
            openapi_spec = response.text

        client = Client.create(openapi_spec)
        return client


ToolboxRef: TypeAlias = Toolbox.get_reference_model()  # type: ignore[valid-type]
