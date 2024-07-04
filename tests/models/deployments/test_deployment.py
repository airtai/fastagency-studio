import uuid
from typing import Any, Dict

import pytest
from pydantic import ValidationError

import fastagency
from fastagency.app import create_deployment_auth_token
from fastagency.models.base import Model
from fastagency.models.deployments.deployment import Deployment
from fastagency.models.secrets.fly_token import FlyToken
from fastagency.models.secrets.github_token import GitHubToken
from fastagency.models.teams.multi_agent_team import MultiAgentTeam
from fastagency.models.teams.two_agent_teams import TwoAgentTeam


class TestDeployment:
    @pytest.mark.parametrize(
        "team_model",
        [TwoAgentTeam, pytest.param(MultiAgentTeam, marks=pytest.mark.skip)],
    )
    @pytest.mark.parametrize("gh_token_model", [(GitHubToken)])
    @pytest.mark.parametrize("fly_token_model", [(FlyToken)])
    def test_deployment_constructor(
        self, team_model: Model, gh_token_model: Model, fly_token_model: Model
    ) -> None:
        team_uuid = uuid.uuid4()
        team = team_model.get_reference_model()(uuid=team_uuid)

        gh_token_uuid = uuid.uuid4()
        gh_token = gh_token_model.get_reference_model()(uuid=gh_token_uuid)

        fly_token_uuid = uuid.uuid4()
        fly_token = fly_token_model.get_reference_model()(uuid=fly_token_uuid)

        try:
            deployment = Deployment(
                team=team,
                name="Test Deployment",
                gh_token=gh_token,
                fly_token=fly_token,
            )
        except ValidationError:
            # print(f"{e.errors()=}")
            raise

        assert deployment.team == team

    @pytest.mark.asyncio()
    async def test_create_deployment_token(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        deployment_uuid = str(uuid.uuid4())

        async def mock_find_model_using_raw(
            *args: Any, **kwargs: Any
        ) -> Dict[str, str]:
            return {
                "user_uuid": user_uuid,
                "uuid": deployment_uuid,
            }

        monkeypatch.setattr(
            fastagency.app, "find_model_using_raw", mock_find_model_using_raw
        )

        token = await create_deployment_auth_token(user_uuid, deployment_uuid)
        assert isinstance(token.auth_token, str)
        assert len(token.auth_token) == 32, token.auth_token

    def test_deployment_model_schema(self) -> None:
        schema = Deployment.model_json_schema()
        expected = {
            "$defs": {
                "FlyTokenRef": {
                    "properties": {
                        "type": {
                            "const": "secret",
                            "default": "secret",
                            "description": "The name of the type of the data",
                            "enum": ["secret"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "FlyToken",
                            "default": "FlyToken",
                            "description": "The name of the data",
                            "enum": ["FlyToken"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "FlyTokenRef",
                    "type": "object",
                },
                "GitHubTokenRef": {
                    "properties": {
                        "type": {
                            "const": "secret",
                            "default": "secret",
                            "description": "The name of the type of the data",
                            "enum": ["secret"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "GitHubToken",
                            "default": "GitHubToken",
                            "description": "The name of the data",
                            "enum": ["GitHubToken"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "GitHubTokenRef",
                    "type": "object",
                },
                "TwoAgentTeamRef": {
                    "properties": {
                        "type": {
                            "const": "team",
                            "default": "team",
                            "description": "The name of the type of the data",
                            "enum": ["team"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "TwoAgentTeam",
                            "default": "TwoAgentTeam",
                            "description": "The name of the data",
                            "enum": ["TwoAgentTeam"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "TwoAgentTeamRef",
                    "type": "object",
                },
            },
            "properties": {
                "name": {
                    "description": "The name of the item",
                    "maxLength": 30,
                    "minLength": 1,
                    "title": "Name",
                    "type": "string",
                },
                "team": {
                    "allOf": [{"$ref": "#/$defs/TwoAgentTeamRef"}],
                    "description": "The team that is used in the deployment",
                    "title": "Team name",
                },
                "gh_token": {"$ref": "#/$defs/GitHubTokenRef"},
                "fly_token": {"$ref": "#/$defs/FlyTokenRef"},
            },
            "required": ["name", "team", "gh_token", "fly_token"],
            "title": "Deployment",
            "type": "object",
        }
        # print(f"{schema=}")
        assert schema == expected

    @pytest.mark.parametrize(
        "team_model",
        [TwoAgentTeam, pytest.param(MultiAgentTeam, marks=pytest.mark.skip)],
    )
    @pytest.mark.parametrize("gh_token_model", [(GitHubToken)])
    @pytest.mark.parametrize("fly_token_model", [(FlyToken)])
    def test_assistant_model_validation(
        self, team_model: Model, gh_token_model: Model, fly_token_model: Model
    ) -> None:
        team_uuid = uuid.uuid4()
        team = team_model.get_reference_model()(uuid=team_uuid)

        gh_token_uuid = uuid.uuid4()
        gh_token = gh_token_model.get_reference_model()(uuid=gh_token_uuid)

        fly_token_uuid = uuid.uuid4()
        fly_token = fly_token_model.get_reference_model()(uuid=fly_token_uuid)

        deployment = Deployment(
            team=team, name="Test Deployment", gh_token=gh_token, fly_token=fly_token
        )

        deployment_json = deployment.model_dump_json()
        # print(f"{deployment_json=}")
        assert deployment_json is not None

        validated_deployment = Deployment.model_validate_json(deployment_json)
        # print(f"{validated_agent=}")
        assert validated_deployment is not None
        assert validated_deployment == deployment
