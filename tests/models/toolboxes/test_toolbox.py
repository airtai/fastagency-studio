import uuid

from fastagency.models.secrets.openapi_auth import OpenAPIAuthRef
from fastagency.models.toolboxes.toolbox import Toolbox


class TestToolbox:
    def test_toolbox_constructor(self, fastapi_openapi_url: str) -> None:
        auth_uuid = uuid.uuid4()
        openapi_auth_ref = OpenAPIAuthRef(uuid=auth_uuid)

        toolbox = Toolbox(
            name="test_toolbox_constructor",
            openapi_url=fastapi_openapi_url,
            openapi_auth=openapi_auth_ref,
        )

        assert toolbox
        assert toolbox.name == "test_toolbox_constructor"
        assert str(toolbox.openapi_url) == fastapi_openapi_url
        assert toolbox.openapi_auth.uuid == auth_uuid  # type: ignore[union-attr]
