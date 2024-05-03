import random
from typing import AsyncIterator

import pytest_asyncio

from fastagency.helpers import get_db_connection


@pytest_asyncio.fixture
async def user_id() -> AsyncIterator[int]:
    try:
        random_id = random.randint(1, 1_000_000)
        async with get_db_connection() as db:
            user = await db.user.create(
                data={
                    "email": f"user{random_id}@airt.ai",
                    "username": f"user{random_id}",
                }
            )
        yield user.id
    finally:
        pass
