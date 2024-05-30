from contextlib import asynccontextmanager
from os import environ
from typing import Any, AsyncGenerator, Dict, Optional, Union
from uuid import UUID

from fastapi import HTTPException
from prisma import Prisma  # type: ignore [attr-defined]


@asynccontextmanager
async def get_db_connection(
    db_url: Optional[str] = None,
) -> AsyncGenerator[Prisma, None]:
    if not db_url:
        db_url = environ.get("PY_DATABASE_URL", None)
        if not db_url:
            raise ValueError(
                "No database URL provided nor set as environment variable 'PY_DATABASE_URL'"
            )  # pragma: no cover
    if "connect_timeout" not in db_url:
        db_url += "?connect_timeout=60"
    db = Prisma(datasource={"url": db_url})
    await db.connect()
    try:
        yield db
    finally:
        await db.disconnect()


async def get_wasp_db_url() -> str:
    wasp_db_url: str = environ.get("DATABASE_URL")  # type: ignore[assignment]
    if "connect_timeout" not in wasp_db_url:
        wasp_db_url += "?connect_timeout=60"
    return wasp_db_url


async def find_model_using_raw(
    model_uuid: Union[str, UUID], user_uuid: Union[str, UUID]
) -> Dict[str, Any]:
    if isinstance(model_uuid, UUID):
        model_uuid = str(model_uuid)
    if isinstance(user_uuid, UUID):
        user_uuid = str(user_uuid)

    async with get_db_connection() as db:
        model: Optional[Dict[str, Any]] = await db.query_first(
            'SELECT * from "Model" where uuid='  # nosec: [B608]
            + f"'{model_uuid}' and user_uuid='{user_uuid}'"
        )

    if not model:
        raise HTTPException(
            status_code=404,
            detail=f"model_uuid {model_uuid} and user_uuid {user_uuid} not found",
        )
    return model


async def find_model_with_uuid_only_using_raw(
    model_uuid: Union[str, UUID],
) -> Dict[str, Any]:
    if isinstance(model_uuid, UUID):
        model_uuid = str(model_uuid)
    async with get_db_connection() as db:
        model: Optional[Dict[str, Any]] = await db.query_first(
            'SELECT * from "Model" where uuid='  # nosec: [B608]
            + f"'{model_uuid}'"
        )

    if not model:
        raise HTTPException(
            status_code=404,
            detail=f"model_uuid {model_uuid} not found",
        )
    return model


async def find_application_using_raw(
    application_uuid: Union[str, UUID],
) -> Dict[str, Any]:
    if isinstance(application_uuid, UUID):
        application_uuid = str(application_uuid)

    async with get_db_connection() as db:
        application: Optional[Dict[str, Any]] = await db.query_first(
            'SELECT * from "Application" where uuid='  # nosec: [B608]
            + f"'{application_uuid}'"
        )

    if not application:
        raise HTTPException(
            status_code=404,
            detail=f"application_uuid {application_uuid} not found",
        )
    return application
