import argparse
import logging
import random
import shutil
import subprocess  # nosec B404
import tempfile
import uuid
from os import environ
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import httpx
import requests

logging.basicConfig(level=logging.INFO)


def _make_request(
    url: str, headers: Dict[str, str]
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    with httpx.Client() as httpx_client:
        response = httpx_client.get(url, headers=headers)  # type: ignore[arg-type]
        response.raise_for_status()
    ret_val = response.json()
    if (
        isinstance(ret_val, dict)
        or isinstance(ret_val, list)
        and all(isinstance(i, dict) for i in ret_val)
    ):
        return ret_val
    else:
        raise ValueError("Unexpected response from the API")


class InvalidGHTokenError(Exception):
    def __init__(self, message: str):
        """Exception raised when an error occurs while creating a GitHub repository."""
        self.message = message
        super().__init__(self.message)


class InvalidFlyTokenError(Exception):
    def __init__(self, message: str):
        """Exception raised when an error occurs while validating the Fly.io token."""
        self.message = message
        super().__init__(self.message)


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
            logging.error(f"Command '{command}' failed with error: {e}")
            # logging.error(f"Stderr output:\n{e.stderr}")
            raise RuntimeError(f"Failed to execute command: {command}") from e

    def _setup_app_in_fly(self, temp_dir_path: Path, env: Dict[str, Any]) -> str:
        cwd = temp_dir_path / SaasAppGenerator.EXTRACTED_TEMPLATE_DIR_NAME

        command = "cd app"
        self._run_cli_command(command, cwd=str(cwd))

        cwd_app = str(cwd / "app")

        # Add FLY_API_TOKEN to the environment variables to pass to the subprocess
        env["FLY_API_TOKEN"] = self.fly_api_token

        repo_name = f"{self.app_name.replace(' ', '-').lower()}-{uuid.uuid4()}"
        command = f"wasp deploy fly setup {repo_name} mia"
        self._run_cli_command(command, cwd=cwd_app, env=env)

        command = "echo | wasp deploy fly create-db mia"
        self._run_cli_command(command, cwd=cwd_app, env=env)

        return repo_name

    def validate_gh_token(self, env: Dict[str, Any]) -> None:
        env["GH_TOKEN"] = self.github_token

        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                log_file = Path(temp_dir) / "log_file.txt"
                command = f"gh auth status > {log_file}"
                self._run_cli_command(command, env=env, print_output=True)

                with log_file.open("r") as file:
                    contents = file.read().strip()

                if "GH_TOKEN is invalid" in contents:
                    msg = "Invalid GitHub token. Please provide a valid GitHub token."
                    raise Exception(msg)

            except Exception as e:
                logging.error(e)
                raise InvalidGHTokenError(msg) from e

    def validate_fly_token(self, env: Dict[str, Any]) -> None:
        env["FLY_API_TOKEN"] = self.fly_api_token

        try:
            command = 'fly auth whoami --access-token "$FLY_API_TOKEN"'
            self._run_cli_command(command, env=env)
        except Exception as e:
            logging.error(e)
            msg = "Invalid Fly.io token. Please provide a valid Fly.io token."
            raise InvalidFlyTokenError(msg) from e

    def validate_tokens(self) -> None:
        env = environ.copy()

        self.validate_gh_token(env)
        self.validate_fly_token(env)

    def create_new_repository(
        self,
        max_retries: int = 5,
    ) -> None:
        # copy the environment variables to pass to the subprocess
        env = environ.copy()

        # Add the GitHub token to the environment variables to pass to the subprocess
        env["GH_TOKEN"] = self.github_token

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)

            repo_name = f"{self.app_name.replace(' ', '-')}".lower()
            for attempt in range(max_retries):
                try:
                    log_file = temp_dir_path / "log_file.txt"
                    command = f"gh repo create {repo_name} --public > {log_file}"
                    self._run_cli_command(command, cwd=str(temp_dir_path), env=env)

                    # Open the log file and read its contents
                    with log_file.open("r") as file:
                        self.gh_repo_url = file.read().strip()

                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        # add random 5 digit number to the repo name
                        repo_name = f"{repo_name}-{random.randint(10000, 99999)}"  # nosec B311
                        logging.info(
                            f"Repository name already exists. Retrying with a new name: {repo_name}"
                        )
                    else:
                        logging.error(e)
                        msg = "Unable to create a new GitHub repository. Please try again later."
                        raise InvalidGHTokenError(msg) from e

    @staticmethod
    def _get_account_name_and_repo_name(gh_repo_url: str) -> str:
        url_parts = gh_repo_url.split("/")
        account_and_repo_name = "/".join(url_parts[-2:])
        return account_and_repo_name.strip()

    def _get_github_username_and_email(self) -> Tuple[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.github_token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        user_response: Dict[str, Any] = _make_request(
            "https://api.github.com/user", headers
        )  # type: ignore[assignment]
        name = user_response["name"]

        email_response: List[Dict[str, Any]] = _make_request(
            "https://api.github.com/user/emails", headers
        )  # type: ignore[assignment]
        primary_email = next(
            (email["email"] for email in email_response if email["primary"]),
            email_response[0]["email"],
        )

        return name, primary_email

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

        # get name and email from the GitHub token and pass it to git commit
        github_username, github_email = self._get_github_username_and_email()

        # set the git user name and email address for the repository
        command = f'git config user.name "{github_username}"'
        self._run_cli_command(command, cwd=cwd)

        command = f'git config user.email "{github_email}"'
        self._run_cli_command(command, cwd=cwd)

        # commit the changes
        command = 'git commit -m "Create a new FastAgency SaaS application"'
        self._run_cli_command(command, cwd=cwd)

        # git remote add origin
        command = "git branch -M main"
        self._run_cli_command(command, cwd=cwd)

        # get the account name and repo name
        # create_cmd_output_file_path = Path(
        #     f"{temp_dir_path}/{SaasAppGenerator.ARTIFACTS_DIR}/create-repo.txt"
        # )
        account_and_repo_name = self._get_account_name_and_repo_name(self.gh_repo_url)

        # set the remote origin
        command = f"git remote add origin git@github.com:{account_and_repo_name}.git"
        self._run_cli_command(command, cwd=cwd)

        # Set GitHub Actions secrets
        self._set_github_actions_secrets(cwd, env=env)

        # Update repo settings to allow GitHub Actions to create and approve pull requests
        # self._set_gh_actions_to_create_pr(account_and_repo_name, cwd=cwd, env=env)

        # push the changes
        command = "git push -u origin main"
        self._run_cli_command(command, cwd=cwd)

    def _set_github_actions_secrets(self, cwd: str, env: Dict[str, Any]) -> None:
        secrets_env = env.copy()

        secrets_env["FLY_API_TOKEN"] = self.fly_api_token
        command = 'gh secret set FLY_API_TOKEN --body "$FLY_API_TOKEN" --app actions'
        self._run_cli_command(command, cwd=cwd, env=env, print_output=True)

        secrets_env["FASTAGENCY_APPLICATION_UUID"] = self.fastagency_application_uuid
        command = 'gh secret set FASTAGENCY_APPLICATION_UUID --body "$FASTAGENCY_APPLICATION_UUID" --app actions'
        self._run_cli_command(command, cwd=cwd, env=env, print_output=True)

    def execute(self) -> str:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)

            # Download the public repository
            self._download_template_repo(temp_dir_path)

            # copy the environment variables to pass to the subprocess
            env = environ.copy()

            # Setup the app in fly
            flyio_app_name = self._setup_app_in_fly(temp_dir_path, env=env)

            # Add the GitHub token to the environment variables to pass to the subprocess
            env["GH_TOKEN"] = self.github_token

            # Create a new repository
            # self.create_new_repository(temp_dir_path, max_retries, env=env)

            # Initialize the git repository and push the changes
            self._initialize_git_and_push(temp_dir_path, env=env)

            flyio_app_url = f"https://{flyio_app_name}-client.fly.dev"

            return flyio_app_url


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("fly_token", help="Fly.io token")
    parser.add_argument("uuid", help="Application UUID")
    parser.add_argument("gh_token", help="GitHub token")
    parser.add_argument("app_name", help="Application name")
    args = parser.parse_args()

    manager = SaasAppGenerator(args.fly_token, args.uuid, args.gh_token, args.app_name)

    manager.create_new_repository()
    logging.info(f"{manager.gh_repo_url=}")

    flyio_app_url = manager.execute()
    logging.info(f"{flyio_app_url=}")


if __name__ == "__main__":
    main()
