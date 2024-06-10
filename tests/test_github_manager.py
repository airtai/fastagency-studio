import tempfile
import zipfile
from pathlib import Path
from unittest.mock import MagicMock, mock_open, patch

import pytest

from fastagency.github_manager import GitHubManager


@pytest.fixture()
def github_manager(monkeypatch: pytest.MonkeyPatch) -> GitHubManager:
    with monkeypatch.context() as mp:
        # Set environment variables
        mp.setenv("FLY_API_TOKEN", "some-token")
        mp.setenv("FASTAGENCY_APPLICATION_UUID", "some-uuid")

        return GitHubManager()


def test_github_manager_without_env_vars() -> None:
    with pytest.raises(OSError, match="FLY_API_TOKEN not set in the environment"):
        GitHubManager()


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
            github_manager._download_template_repo(temp_dir)

            # Ensure the zip file is written
            # mocked_file.assert_called_once_with(zip_path, 'wb')
            mocked_file().write.assert_called_once_with(zip_content)

        # Ensure the archive is unpacked and moved correctly
        mock_unpack_archive.assert_called_once_with(str(zip_path), str(temp_dir_path))

        # Ensure the directory structure is correct after moving files
        assert (temp_dir_path / "dummy_file.txt").exists()
        assert len(list(temp_dir_path.iterdir())) == 1
