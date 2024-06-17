ARG BASE_IMAGE=ubuntu:22.04

FROM $BASE_IMAGE

SHELL ["/bin/bash", "-c"]

# needed to suppress tons of debconf messages
ENV DEBIAN_FRONTEND noninteractive

RUN apt update --fix-missing && apt upgrade --yes \
    && apt install -y software-properties-common apt-utils build-essential git wget curl \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt update \
    && apt install -y --no-install-recommends python3.11-dev python3.11-distutils python3-pip python3-apt \
    && apt purge --auto-remove \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Install node and npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y --no-install-recommends nodejs \
    && apt purge --auto-remove && apt clean && rm -rf /var/lib/apt/lists/*

# Set python3.11 as default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

RUN python3 -m pip install --upgrade pip

COPY migrations ./migrations
COPY templates ./templates
COPY fastagency ./fastagency
COPY scripts/* schema.prisma pyproject.toml README.md ./
RUN pip install -e ".[dev]"

# Install wasp
RUN curl -sSL https://get.wasp-lang.dev/installer.sh | sh
# Install github cli
RUN (type -p wget >/dev/null || (apt update && apt-get install wget -y)) \
    && mkdir -p -m 755 /etc/apt/keyrings \
    && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt update \
    && apt install gh -y \
    && rm -rf /var/lib/apt/lists/*
ENV PATH="${PATH}:/root/.local/bin"
# Install flyctl
RUN curl -L https://fly.io/install.sh | sh
ENV PATH="${PATH}:/root/.fly/bin"
Run which flyctl

EXPOSE ${PORT}

ENTRYPOINT []
CMD [ "/usr/bin/bash", "-c", "./run_server.sh" ]
