from contextlib import asynccontextmanager
from os import environ
from typing import AsyncGenerator, Optional

from prisma import Prisma  # type: ignore [attr-defined]


@asynccontextmanager
async def get_db_connection(
    db_url: Optional[str] = None,
) -> AsyncGenerator[Prisma, None]:
    if not db_url:
        db_url = environ.get("PY_DATABASE_URL", None)
        if not db_url:
            raise ValueError(
                "No database URL provided nor set as environment variable 'DATABASE_URL'"
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
