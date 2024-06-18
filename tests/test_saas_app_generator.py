import subprocess
import tempfile
import uuid
import zipfile
from pathlib import Path
from unittest.mock import ANY, MagicMock, call, mock_open, patch

import pytest

from fastagency.saas_app_generator import SaasAppGenerator


@pytest.fixture()
def saas_app_generator() -> SaasAppGenerator:
    fly_api_token = "some-token"
    fastagency_application_uuid = "some-uuid"
    github_token = "some-github-token"
    app_name = "test fastagency template"

    return SaasAppGenerator(
        fly_api_token, fastagency_application_uuid, github_token, app_name
    )


def test_get_account_name_and_repo_name() -> None:
    fixture = "https://github.com/account-name/repo-name"
    expected = "account-name/repo-name"
    actual = SaasAppGenerator._get_account_name_and_repo_name(fixture)
    assert actual == expected


@patch("requests.get")
@patch("shutil.unpack_archive")
def test_download_template_repo(
    mock_unpack_archive: MagicMock,
    mock_get: MagicMock,
    saas_app_generator: SaasAppGenerator,
) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        # mock requests.get
        temp_dir_path = Path(temp_dir)
        repo_name = "fastagency-wasp-app-template"
        repo_main_dir = temp_dir_path / f"{repo_name}-main"
        mock_response = MagicMock()
        zip_content = b"fake-zip-content"
        mock_response.status_code = 200
        mock_response.content = zip_content
        mock_get.return_value = mock_response

        # Create a fake directory structure to mimic the unzipped content
        repo_main_dir.mkdir()
        (repo_main_dir / "dummy_file.txt").touch()

        zip_path = temp_dir_path / f"{repo_name}.zip"
        with zipfile.ZipFile(str(zip_path), "w") as zip_file:
            zip_file.writestr(f"{repo_name}-main", "dummy content")

        with patch.object(Path, "open", mock_open()) as mocked_file:
            saas_app_generator._download_template_repo(Path(temp_dir))

            # Ensure the zip file is written
            # mocked_file.assert_called_once_with(zip_path, 'wb')
            mocked_file().write.assert_called_once_with(zip_content)

        # Ensure the archive is unpacked and moved correctly
        mock_unpack_archive.assert_called_once_with(str(zip_path), str(temp_dir_path))

        # Ensure the directory structure is correct after moving files
        assert (temp_dir_path / repo_main_dir / "dummy_file.txt").exists()
        assert len(list(temp_dir_path.iterdir())) == 1


@patch("subprocess.run")
def test_run_cli_command(
    mock_run: MagicMock, saas_app_generator: SaasAppGenerator
) -> None:
    command = "ls"
    saas_app_generator._run_cli_command(command)
    mock_run.assert_called_once_with(
        command,
        check=True,
        capture_output=True,
        shell=True,
        text=True,
        cwd=None,
        env=None,
    )


@patch("subprocess.run")
@patch.dict("os.environ", {}, clear=True)
def test_create_new_repository(
    mock_run: MagicMock, saas_app_generator: SaasAppGenerator
) -> None:
    with patch.object(Path, "open", mock_open()):
        saas_app_generator.create_new_repository(max_retries=1)

    expected_command = "gh repo create test-fastagency-template --public > "

    # Get the actual command that was called
    actual_command = mock_run.call_args[0][0]

    # Assert that the actual command starts with the expected command
    assert actual_command.startswith(
        expected_command
    ), f"Command {actual_command} does not start with {expected_command}"

    # Assert the other call parameters
    mock_run.assert_called_once_with(
        ANY,
        check=True,
        capture_output=True,
        shell=True,
        text=True,
        cwd=ANY,
        env={"GH_TOKEN": saas_app_generator.github_token},
    )


@patch("subprocess.run")
@patch.dict("os.environ", {}, clear=True)
def test_create_new_repository_retry(
    mock_run: MagicMock, saas_app_generator: SaasAppGenerator
) -> None:
    with patch.object(Path, "open", mock_open()):
        # Simulate "Name already exists on this account" error for the first two attempts
        mock_run.side_effect = [
            subprocess.CalledProcessError(
                1,
                "gh",
                output="Name already exists on this account",
                stderr="Name already exists on this account",
            )
        ] * 2 + [None]

        # Call the method
        saas_app_generator.create_new_repository(max_retries=3)

        # Check that the method was called three times
        assert mock_run.call_count == 3


@patch("subprocess.run")
def test_create_new_repository_retry_fail(
    mock_run: MagicMock, saas_app_generator: SaasAppGenerator
) -> None:
    # Simulate "Name already exists on this account" error for all attempts
    mock_run.side_effect = subprocess.CalledProcessError(
        1,
        "gh",
        output="Name already exists on this account",
        stderr="Name already exists on this account",
    )

    # Call the method and expect an exception
    with pytest.raises(Exception, match="Name already exists on this account") as e:
        saas_app_generator.create_new_repository(max_retries=3)

    assert "Name already exists on this account" in str(e)

    # Check that the method was called three times
    assert mock_run.call_count == 3


@patch("subprocess.run")
def test_create_new_repository_with_non_retry_exception(
    mock_run: MagicMock, saas_app_generator: SaasAppGenerator
) -> None:
    # Simulate "Name already exists on this account" error for all attempts
    mock_run.side_effect = subprocess.CalledProcessError(
        1, "gh", output="Bad credentials", stderr="Bad credentials"
    )

    # Call the method and expect an exception
    with pytest.raises(Exception, match="Bad credentials") as e:
        saas_app_generator.create_new_repository(max_retries=3)

    assert "Bad credentials" in str(e)

    # Check that the method was called three times
    assert mock_run.call_count == 1


@patch("subprocess.run")
def test_set_github_actions_secrets(
    mock_run: MagicMock, saas_app_generator: SaasAppGenerator
) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        saas_app_generator._set_github_actions_secrets(cwd=temp_dir, env={})
        expected_commands = [
            'gh secret set FLY_API_TOKEN --body "some-token" --app actions',
            'gh secret set FASTAGENCY_APPLICATION_UUID --body "some-uuid" --app actions',
        ]
        for command in expected_commands:
            mock_run.assert_any_call(
                command,
                check=True,
                capture_output=True,
                shell=True,
                text=True,
                cwd=temp_dir,
                env={},
            )


@patch("fastagency.saas_app_generator._make_request")
def test_get_github_username_and_primary_email(
    mock_make_request: MagicMock, saas_app_generator: SaasAppGenerator
) -> None:
    # Arrange
    mock_make_request.side_effect = [
        {"name": "test_username", "login": "test_user", "id": 12345},  # First response
        [
            {
                "email": "test_username@gmail.com",
                "primary": False,
                "verified": True,
                "visibility": None,
            },
            {
                "email": "test_username_primary@gmail.com",
                "primary": True,
                "verified": True,
                "visibility": "public",
            },
        ],  # Second response
    ]

    actual = saas_app_generator._get_github_username_and_email()
    expected = ("test_username", "test_username_primary@gmail.com")
    assert actual == expected
    mock_make_request.assert_has_calls(
        [
            call("https://api.github.com/user", ANY),  # Replace ANY with actual headers
            call(
                "https://api.github.com/user/emails", ANY
            ),  # Replace ANY with actual headers
        ]
    )


@patch("fastagency.saas_app_generator._make_request")
def test_get_github_username_and_non_primary_email(
    mock_make_request: MagicMock, saas_app_generator: SaasAppGenerator
) -> None:
    # Arrange
    mock_make_request.side_effect = [
        {"name": "test_username", "login": "test_user", "id": 12345},  # First response
        [
            {
                "email": "test_username@gmail.com",
                "primary": False,
                "verified": True,
                "visibility": None,
            }
        ],  # Second response
    ]

    actual = saas_app_generator._get_github_username_and_email()
    expected = ("test_username", "test_username@gmail.com")
    assert actual == expected
    mock_make_request.assert_has_calls(
        [
            call("https://api.github.com/user", ANY),  # Replace ANY with actual headers
            call(
                "https://api.github.com/user/emails", ANY
            ),  # Replace ANY with actual headers
        ]
    )


@patch.dict("os.environ", {}, clear=True)
@patch("subprocess.run")
def test_initialize_git_and_push(
    mock_run: MagicMock,
    saas_app_generator: SaasAppGenerator,
) -> None:
    with (
        tempfile.TemporaryDirectory() as temp_dir,
        patch.object(
            SaasAppGenerator,
            "_get_account_name_and_repo_name",
            return_value="account/repo",
        ),
        patch.object(
            SaasAppGenerator,
            "_get_github_username_and_email",
            return_value=("John Doe", "john@doe.org"),
        ),
        patch.object(Path, "open", mock_open()),
    ):
        temp_dir_path = Path(temp_dir)
        extracted_template_dir = (
            temp_dir_path / SaasAppGenerator.EXTRACTED_TEMPLATE_DIR_NAME
        )
        extracted_template_dir.mkdir(parents=True, exist_ok=True)

        saas_app_generator.create_new_repository(max_retries=1)
        saas_app_generator._initialize_git_and_push(temp_dir_path, env={})

        expected_commands = [
            "git init",
            "git add .",
            'git config user.name "John Doe"',
            'git config user.email "john@doe.org"',
            'git commit -m "Create a new FastAgency SaaS application"',
            "git branch -M main",
            "git remote add origin git@github.com:account/repo.git",
            "git push -u origin main",
        ]

        for command in expected_commands:
            mock_run.assert_any_call(
                command,
                check=True,
                capture_output=True,
                shell=True,
                text=True,
                cwd=str(extracted_template_dir),
                env=None,
            )


@patch("subprocess.run")
@patch.dict("os.environ", {"FLY_API_TOKEN": "some-token"}, clear=True)
@patch(
    "uuid.uuid4", return_value=uuid.UUID(int=0)
)  # Patch uuid4 to return a static UUID
def test_setup_app_in_fly(
    mock_uuid4: MagicMock, mock_run: MagicMock, saas_app_generator: SaasAppGenerator
) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        extracted_template_dir = (
            temp_dir_path / SaasAppGenerator.EXTRACTED_TEMPLATE_DIR_NAME
        )
        extracted_template_dir.mkdir(parents=True, exist_ok=True)

        saas_app_generator._setup_app_in_fly(temp_dir_path, env={})

        repo_name = f"{saas_app_generator.app_name.replace(' ', '-').lower()}-{mock_uuid4.return_value}"
        expected_commands = [
            "cd app",
            f"wasp deploy fly setup {repo_name} mia",
            "echo | wasp deploy fly create-db mia",
        ]

        for command, index in zip(expected_commands, range(len(expected_commands))):
            mock_run.assert_any_call(
                command,
                check=True,
                capture_output=True,
                shell=True,
                text=True,
                cwd=str(extracted_template_dir)
                if index == 0
                else str(extracted_template_dir / "app"),
                env=None
                if index == 0
                else {"FLY_API_TOKEN": saas_app_generator.fly_api_token},
            )


@patch("fastagency.saas_app_generator.SaasAppGenerator._initialize_git_and_push")
@patch("fastagency.saas_app_generator.SaasAppGenerator._download_template_repo")
@patch("fastagency.saas_app_generator.SaasAppGenerator._setup_app_in_fly")
@patch.dict("os.environ", {}, clear=True)
@patch("tempfile.TemporaryDirectory", new_callable=MagicMock)
def test_execute(
    mock_tempdir: MagicMock,
    mock_setup_app_in_fly: MagicMock,
    mock_download: MagicMock,
    mock_init_git: MagicMock,
    saas_app_generator: SaasAppGenerator,
) -> None:
    temp_dir_path = Path("/mock/temp/dir")
    mock_tempdir.return_value.__enter__.return_value = temp_dir_path

    saas_app_generator.gh_repo_url = ""
    saas_app_generator.execute()

    mock_download.assert_called_once_with(temp_dir_path)
    mock_setup_app_in_fly.assert_called_once()
    mock_init_git.assert_called_once_with(
        temp_dir_path, env={"GH_TOKEN": "some-github-token"}
    )
