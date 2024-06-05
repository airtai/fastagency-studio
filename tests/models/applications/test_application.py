import uuid

import pytest
from pydantic import ValidationError

from fastagency.models.applications.application import Application
from fastagency.models.base import Model
from fastagency.models.teams.multi_agent_team import MultiAgentTeam
from fastagency.models.teams.two_agent_teams import TwoAgentTeam


class TestApplication:
    @pytest.mark.parametrize("team_model", [TwoAgentTeam, MultiAgentTeam])
    def test_application_constructor(self, team_model: Model) -> None:
        team_uuid = uuid.uuid4()
        team = team_model.get_reference_model()(uuid=team_uuid)

        try:
            application = Application(
                team=team,
                name="Test Application",
            )
        except ValidationError:
            # print(f"{e.errors()=}")
            raise

        assert application.team == team

    def test_application_model_schema(self) -> None:
        schema = Application.model_json_schema()
        expected = {
            "$defs": {
                "MultiAgentTeamRef": {
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
                            "const": "MultiAgentTeam",
                            "default": "MultiAgentTeam",
                            "description": "The name of the data",
                            "enum": ["MultiAgentTeam"],
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
                    "title": "MultiAgentTeamRef",
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
                    "minLength": 1,
                    "title": "Name",
                    "type": "string",
                },
                "team": {
                    "anyOf": [
                        {"$ref": "#/$defs/MultiAgentTeamRef"},
                        {"$ref": "#/$defs/TwoAgentTeamRef"},
                    ],
                    "description": "The team that is used in the application",
                    "title": "Team name",
                },
            },
            "required": ["name", "team"],
            "title": "Application",
            "type": "object",
        }
        # print(f"{schema=}")
        assert schema == expected

    @pytest.mark.parametrize("team_model", [TwoAgentTeam, MultiAgentTeam])
    def test_assistant_model_validation(self, team_model: Model) -> None:
        team_uuid = uuid.uuid4()
        team = team_model.get_reference_model()(uuid=team_uuid)

        application = Application(
            team=team,
            name="Test Application",
        )

        application_json = application.model_dump_json()
        # print(f"{application_json=}")
        assert application_json is not None

        validated_application = Application.model_validate_json(application_json)
        # print(f"{validated_agent=}")
        assert validated_application is not None
        assert validated_application == application
