ARG UV_VERSION=latest
ARG DEBIAN_VERSION=bookworm


FROM ghcr.io/astral-sh/uv:$UV_VERSION AS uv
FROM mcr.microsoft.com/vscode/devcontainers/base:$DEBIAN_VERSION

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    # To remove the image size, it is recommended refresh the package cache as follows
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://aka.ms/install-azd.sh | bash


COPY --from=uv --chown=vscode: /uv /uvx /bin/