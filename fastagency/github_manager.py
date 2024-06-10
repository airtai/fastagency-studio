import logging
import shutil
import subprocess  # nosec B404
import tempfile
from os import environ
from pathlib import Path

import requests

logging.basicConfig(level=logging.INFO)


class GitHubManager:
    TEMPLATE_REPO_URL = "https://github.com/airtai/fastagency-wasp-app-template"

    def __init__(self) -> None:
        """GitHubManager class."""
        self.template_repo_url = GitHubManager.TEMPLATE_REPO_URL
        self.fly_api_token = GitHubManager._get_env_var("FLY_API_TOKEN")
        self.fastagency_application_uuid = GitHubManager._get_env_var(
            "FASTAGENCY_APPLICATION_UUID"
        )

    @staticmethod
    def _get_env_var(var_name: str) -> str:
        if var_name not in environ:
            raise OSError(f"{var_name} not set in the environment")
        return environ[var_name]

    def _download_template_repo(self, temp_dir: str) -> None:
        owner, repo = self.template_repo_url.rstrip("/").rsplit("/", 2)[-2:]
        zip_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/main.zip"
        response = requests.get(zip_url, timeout=10)
        if response.status_code == 200:
            temp_dir_path = Path(temp_dir)
            zip_path = temp_dir_path / f"{repo}.zip"
            with Path(zip_path).open("wb") as file:
                file.write(response.content)

            shutil.unpack_archive(str(zip_path), str(temp_dir_path))

            for item in (temp_dir_path / f"{repo}-main").iterdir():
                shutil.move(str(item), str(temp_dir_path))
            shutil.rmtree(temp_dir_path / f"{repo}-main")
            zip_path.unlink()
        else:
            raise Exception(f"Error downloading repository: {response.status_code}")

    def run_cli_command(self, command: str) -> None:
        try:
            logging.info(f"Running command: {command}")
            result = subprocess.run(command, check=True, capture_output=True)  # nosec B603
            logging.info(result.stdout.decode())
        except subprocess.CalledProcessError as e:
            logging.error(e.stderr.decode())
            raise

    def execute(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download the public repository
            self._download_template_repo(temp_dir)


def main() -> None:
    manager = GitHubManager()
    manager.execute()


if __name__ == "__main__":
    main()
