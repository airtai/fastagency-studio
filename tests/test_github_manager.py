import subprocess
import tempfile
import zipfile
from pathlib import Path
from unittest.mock import MagicMock, mock_open, patch

import pytest

from fastagency.github_manager import GitHubManager


@pytest.fixture()
def github_manager() -> GitHubManager:
    fly_api_token = "some-token"
    fastagency_application_uuid = "some-uuid"
    github_token = "some-github-token"

    return GitHubManager(fly_api_token, fastagency_application_uuid, github_token)


def test_get_account_name_and_repo_name() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        artifacts_dir = temp_dir_path / GitHubManager.ARTIFACTS_DIR
        artifacts_dir.mkdir()

        create_cmd_output_file_path = artifacts_dir / "create-repo.txt"
        with create_cmd_output_file_path.open("w") as f:
            f.write("https://github.com/account-name/repo-name")

        expected = "account-name/repo-name"
        actual = GitHubManager._get_account_name_and_repo_name(
            create_cmd_output_file_path
        )
        assert actual == expected


@patch("requests.get")
@patch("shutil.unpack_archive")
def test_download_template_repo(
    mock_unpack_archive: MagicMock, mock_get: MagicMock, github_manager: GitHubManager
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

        zip_path = f"{temp_dir_path}/{repo_name}.zip"
        with zipfile.ZipFile(zip_path, "w") as zip_file:
            zip_file.writestr(f"{repo_name}-main", "dummy content")

        with patch.object(Path, "open", mock_open()) as mocked_file:
            github_manager._download_template_repo(Path(temp_dir))

            # Ensure the zip file is written
            # mocked_file.assert_called_once_with(zip_path, 'wb')
            mocked_file().write.assert_called_once_with(zip_content)

        # Ensure the archive is unpacked and moved correctly
        mock_unpack_archive.assert_called_once_with(str(zip_path), str(temp_dir_path))

        # Ensure the directory structure is correct after moving files
        assert (temp_dir_path / repo_main_dir / "dummy_file.txt").exists()
        assert len(list(temp_dir_path.iterdir())) == 1


@patch("subprocess.run")
def test_run_cli_command(mock_run: MagicMock, github_manager: GitHubManager) -> None:
    command = "gh auth login"
    github_manager._run_cli_command(command)
    mock_run.assert_called_once_with(
        command, check=True, capture_output=True, shell=True, text=True, cwd=None
    )


@patch("subprocess.run")
def test_login(mock_run: MagicMock, github_manager: GitHubManager) -> None:
    github_manager._login()
    expected_command = "echo some-github-token | gh auth login --with-token"
    mock_run.assert_called_once_with(
        expected_command,
        check=True,
        capture_output=True,
        shell=True,
        text=True,
        cwd=None,
    )


@patch("subprocess.run")
def test_create_new_repository(
    mock_run: MagicMock, github_manager: GitHubManager
) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        temp_dir_path.mkdir(parents=True, exist_ok=True)
        github_manager._create_new_repository(temp_dir_path, max_retries=1)
        expected_command = f"gh repo create test-fastagency-template --public > {temp_dir_path}/{GitHubManager.ARTIFACTS_DIR}/create-repo.txt"
        mock_run.assert_called_once_with(
            expected_command,
            check=True,
            capture_output=True,
            shell=True,
            text=True,
            cwd=str(temp_dir_path),
        )


@patch("subprocess.run")
def test_create_new_repository_retry(
    mock_run: MagicMock, github_manager: GitHubManager
) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        temp_dir_path.mkdir(parents=True, exist_ok=True)

        # Simulate "Name already exists on this account" error for the first two attempts
        mock_run.side_effect = [
            subprocess.CalledProcessError(
                1, "gh", "Name already exists on this account"
            )
        ] * 2 + [None]

        # Call the method
        github_manager._create_new_repository(temp_dir_path, max_retries=3)

        # Check that the method was called three times
        assert mock_run.call_count == 3


@patch("subprocess.run")
def test_create_new_repository_retry_fail(
    mock_run: MagicMock, github_manager: GitHubManager
) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        temp_dir_path.mkdir(parents=True, exist_ok=True)

        # Simulate "Name already exists on this account" error for all attempts
        mock_run.side_effect = subprocess.CalledProcessError(
            1, "gh", "Name already exists on this account"
        )

        # Call the method and expect an exception
        with pytest.raises(
            Exception, match="Command 'gh' returned non-zero exit status 1."
        ) as e:
            github_manager._create_new_repository(temp_dir_path, max_retries=3)

        assert "Name already exists on this account" in str(e)

        # Check that the method was called three times
        assert mock_run.call_count == 3


@patch("subprocess.run")
def test_set_github_actions_secrets(
    mock_run: MagicMock, github_manager: GitHubManager
) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        github_manager._set_github_actions_secrets(cwd=temp_dir)
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
            )


@patch("subprocess.run")
def test_initialize_git_and_push(
    mock_run: MagicMock, github_manager: GitHubManager
) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        extracted_template_dir = (
            temp_dir_path / GitHubManager.EXTRACTED_TEMPLATE_DIR_NAME
        )
        extracted_template_dir.mkdir(parents=True, exist_ok=True)

        with patch.object(
            GitHubManager,
            "_get_account_name_and_repo_name",
            return_value="account/repo",
        ):
            github_manager._initialize_git_and_push(temp_dir_path)

            expected_commands = [
                "git init",
                "git add .",
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
                )


@patch("fastagency.github_manager.GitHubManager._initialize_git_and_push")
@patch("fastagency.github_manager.GitHubManager._download_template_repo")
@patch("fastagency.github_manager.GitHubManager._login")
@patch("fastagency.github_manager.GitHubManager._logout")
@patch("fastagency.github_manager.GitHubManager._create_new_repository")
@patch("tempfile.TemporaryDirectory", new_callable=MagicMock)
def test_execute(
    mock_tempdir: MagicMock,
    mock_create_repo: MagicMock,
    mock_login: MagicMock,
    mock_logout: MagicMock,
    mock_download: MagicMock,
    mock_init_git: MagicMock,
    github_manager: GitHubManager,
) -> None:
    temp_dir_path = Path("/mock/temp/dir")
    mock_tempdir.return_value.__enter__.return_value = temp_dir_path

    github_manager.execute(max_retries=1)

    mock_download.assert_called_once_with(temp_dir_path)
    mock_login.assert_called_once()
    mock_logout.assert_called_once()
    mock_create_repo.assert_called_once_with(temp_dir_path, 1)
    mock_init_git.assert_called_once_with(temp_dir_path)
