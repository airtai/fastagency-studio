import argparse
import logging
import random
import shutil
import subprocess  # nosec B404
import tempfile
import uuid
from os import environ
from pathlib import Path
from typing import Any, Dict, Optional

import requests

logging.basicConfig(level=logging.INFO)


class SaasAppGenerator:
    TEMPLATE_REPO_URL = "https://github.com/airtai/fastagency-wasp-app-template"
    EXTRACTED_TEMPLATE_DIR_NAME = "fastagency-wasp-app-template-main"
    ARTIFACTS_DIR = ".tmp_fastagency_setup_artifacts"

    def __init__(
        self,
        fly_api_token: str,
        fastagency_application_uuid: str,
        github_token: str,
        app_name: str,
    ) -> None:
        """GitHubManager class."""
        self.template_repo_url = SaasAppGenerator.TEMPLATE_REPO_URL
        self.fly_api_token = fly_api_token
        self.fastagency_application_uuid = fastagency_application_uuid
        self.github_token = github_token
        self.app_name = app_name

    @staticmethod
    def _get_env_var(var_name: str) -> str:
        if var_name not in environ:
            raise OSError(f"{var_name} not set in the environment")
        return environ[var_name]

    def _download_template_repo(self, temp_dir_path: Path) -> None:
        owner, repo = self.template_repo_url.rstrip("/").rsplit("/", 2)[-2:]
        zip_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/main.zip"
        response = requests.get(zip_url, timeout=10)
        if response.status_code == 200:
            zip_path = temp_dir_path / f"{repo}.zip"
            with Path(zip_path).open("wb") as file:
                file.write(response.content)

            shutil.unpack_archive(str(zip_path), str(temp_dir_path))
            zip_path.unlink()

            command = (
                f"ls -la {temp_dir_path}/{SaasAppGenerator.EXTRACTED_TEMPLATE_DIR_NAME}"
            )
            self._run_cli_command(command, print_output=True)
        else:
            raise Exception(f"Error downloading repository: {response.status_code}")

    def _run_cli_command(
        self,
        command: str,
        cwd: Optional[str] = None,
        print_output: bool = False,
        env: Optional[Dict[str, str]] = None,
    ) -> None:
        try:
            logging.info(f"Running command: {command}")
            # nosemgrep: python.lang.security.audit.subprocess-shell-true.subprocess-shell-true
            result = subprocess.run(
                command,
                check=True,
                capture_output=True,
                shell=True,
                text=True,
                cwd=cwd,
                env=env,  # nosec B602
            )
            if print_output:
                logging.info(result.stdout)
            logging.info("Command executed successfully")
        except subprocess.CalledProcessError as e:
            logging.error(f"Command '{command}' failed with error: {e.output}")
            logging.error(f"Stderr output:\n{e.stderr}")
            logging.exception("Exception occurred")
            raise

    def _setup_app_in_fly(self, temp_dir_path: Path, env: Dict[str, Any]) -> None:
        cwd = f"{temp_dir_path}/{SaasAppGenerator.EXTRACTED_TEMPLATE_DIR_NAME}"

        command = "cd app"
        self._run_cli_command(command, cwd=cwd)

        cwd_app = f"{cwd}/app"

        # Add FLY_API_TOKEN to the environment variables to pass to the subprocess
        env["FLY_API_TOKEN"] = self.fly_api_token

        repo_name = f"{self.app_name.replace(' ', '-').lower()}-{uuid.uuid4()}"
        command = f"wasp deploy fly setup {repo_name} mia"
        self._run_cli_command(command, cwd=cwd_app, env=env)

        command = "echo | wasp deploy fly create-db mia"
        self._run_cli_command(command, cwd=cwd_app, env=env)

    def _create_new_repository(
        self, temp_dir_path: Path, max_retries: int, env: Dict[str, Any]
    ) -> None:
        setup_artifacts_path = temp_dir_path / SaasAppGenerator.ARTIFACTS_DIR
        setup_artifacts_path.mkdir(parents=True, exist_ok=True)
        repo_name = f"{self.app_name.replace(' ', '-')}".lower()
        for attempt in range(max_retries):
            try:
                log_file = setup_artifacts_path / "create-repo.txt"
                command = f"gh repo create {repo_name} --public > {log_file}"
                self._run_cli_command(command, cwd=str(temp_dir_path), env=env)
                break
            except Exception as e:
                # check if error contains "Name already exists on this account" string
                if attempt < max_retries - 1:
                    # add random 5 digit number to the repo name
                    repo_name = f"{repo_name}-{random.randint(10000, 99999)}"  # nosec B311
                    logging.info(
                        f"Repository name already exists. Retrying with a new name: {repo_name}"
                    )
                else:
                    logging.error(e)
                    raise

    @staticmethod
    def _get_account_name_and_repo_name(create_cmd_output_file_path: Path) -> str:
        with create_cmd_output_file_path.open("r") as file:
            url_parts = file.read().split("/")
            account_and_repo_name = "/".join(url_parts[-2:])
        return account_and_repo_name.strip()

    def _initialize_git_and_push(
        self, temp_dir_path: Path, env: Dict[str, Any]
    ) -> None:
        cwd = str(temp_dir_path / SaasAppGenerator.EXTRACTED_TEMPLATE_DIR_NAME)

        # initialize a git repository
        command = "git init"
        self._run_cli_command(command, cwd=cwd)

        # add all files to the git repository
        command = "git add ."
        self._run_cli_command(command, cwd=cwd)

        # commit the changes
        command = 'git commit -m "Create a new FastAgency SaaS application"'
        self._run_cli_command(command, cwd=cwd)

        # git remote add origin
        command = "git branch -M main"
        self._run_cli_command(command, cwd=cwd)

        # get the account name and repo name
        create_cmd_output_file_path = Path(
            f"{temp_dir_path}/{SaasAppGenerator.ARTIFACTS_DIR}/create-repo.txt"
        )
        account_and_repo_name = self._get_account_name_and_repo_name(
            create_cmd_output_file_path
        )

        # set the remote origin
        command = f"git remote add origin git@github.com:{account_and_repo_name}.git"
        self._run_cli_command(command, cwd=cwd)

        # Set GitHub Actions secrets
        self._set_github_actions_secrets(cwd, env=env)

        # push the changes
        command = "git push -u origin main"
        self._run_cli_command(command, cwd=cwd)

    def _set_github_actions_secrets(self, cwd: str, env: Dict[str, Any]) -> None:
        secrets = {
            "FLY_API_TOKEN": self.fly_api_token,
            "FASTAGENCY_APPLICATION_UUID": self.fastagency_application_uuid,
        }

        for key, value in secrets.items():
            command = f'gh secret set {key} --body "{value}" --app actions'
            self._run_cli_command(command, cwd=cwd, env=env, print_output=True)

    def execute(self, max_retries: int = 5) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)

            # Download the public repository
            self._download_template_repo(temp_dir_path)

            # copy the environment variables to pass to the subprocess
            env = environ.copy()

            # Setup the app in fly
            self._setup_app_in_fly(temp_dir_path, env=env)

            # Add the GitHub token to the environment variables to pass to the subprocess
            env["GH_TOKEN"] = self.github_token

            # Create a new repository
            self._create_new_repository(temp_dir_path, max_retries, env=env)

            # Initialize the git repository and push the changes
            self._initialize_git_and_push(temp_dir_path, env=env)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("fly_token", help="Fly.io token")
    parser.add_argument("uuid", help="Application UUID")
    parser.add_argument("gh_token", help="GitHub token")
    parser.add_argument("app_name", help="Application name")
    args = parser.parse_args()

    manager = SaasAppGenerator(args.fly_token, args.uuid, args.gh_token, args.app_name)
    manager.execute()


if __name__ == "__main__":
    main()
