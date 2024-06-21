import uuid

import pytest
from pydantic import ValidationError

from fastagency.models.applications.application import Application
from fastagency.models.base import Model
from fastagency.models.secrets.fly_token import FlyToken
from fastagency.models.secrets.github_token import GitHubToken
from fastagency.models.teams.multi_agent_team import MultiAgentTeam
from fastagency.models.teams.two_agent_teams import TwoAgentTeam


class TestApplication:
    @pytest.mark.parametrize(
        "team_model",
        [TwoAgentTeam, pytest.param(MultiAgentTeam, marks=pytest.mark.skip)],
    )
    @pytest.mark.parametrize("gh_token_model", [(GitHubToken)])
    @pytest.mark.parametrize("fly_token_model", [(FlyToken)])
    def test_application_constructor(
        self, team_model: Model, gh_token_model: Model, fly_token_model: Model
    ) -> None:
        team_uuid = uuid.uuid4()
        team = team_model.get_reference_model()(uuid=team_uuid)

        gh_token_uuid = uuid.uuid4()
        gh_token = gh_token_model.get_reference_model()(uuid=gh_token_uuid)

        fly_token_uuid = uuid.uuid4()
        fly_token = fly_token_model.get_reference_model()(uuid=fly_token_uuid)

        try:
            application = Application(
                team=team,
                name="Test Application",
                gh_token=gh_token,
                fly_token=fly_token,
            )
        except ValidationError:
            # print(f"{e.errors()=}")
            raise

        assert application.team == team

    def test_application_model_schema(self) -> None:
        schema = Application.model_json_schema()
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
                    "description": "The team that is used in the application",
                    "title": "Team name",
                },
                "gh_token": {"$ref": "#/$defs/GitHubTokenRef"},
                "fly_token": {"$ref": "#/$defs/FlyTokenRef"},
            },
            "required": ["name", "team", "gh_token", "fly_token"],
            "title": "Application",
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

        application = Application(
            team=team, name="Test Application", gh_token=gh_token, fly_token=fly_token
        )

        application_json = application.model_dump_json()
        # print(f"{application_json=}")
        assert application_json is not None

        validated_application = Application.model_validate_json(application_json)
        # print(f"{validated_agent=}")
        assert validated_application is not None
        assert validated_application == application
