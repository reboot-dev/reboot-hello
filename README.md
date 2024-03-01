# Resemble Hello World

For the impatient:
1. Get a suitable environment:
    * Use VSCode (on your machine)
        * [... connected to a GitHub Codespace](#use-vscode-connected-to-a-github-codespace)
        * [... with a local Dev Container](#use-vscode-with-a-local-dev-container)
    * [Use a Docker Container](#use-a-docker-container)
    * [Install prerequisites manually](#install-prerequisites-manually)
2. [Run the application](#run-the-application)

### Overview

This repository contains an example application written using Resemble.

The '.proto' files can be found in the `api/` directory, grouped into
subdirectories by proto package, while backend specific code can be
found in `backend/` and web specific code in `web/`.

This repository includes a [Dev Container](https://containers.dev/) that _has all of the dependencies you need to build and run code in this repository already installed_.

> [!NOTE]
> The Dev Container's configuration for this repository is found in
> [`.devcontainer/devcontainer.json`](main/.devcontainer/devcontainer.json). You
> may expand on it to customize your development environment to your
> liking.

You can start the Dev Container in two different ways.

<a id="use-vscode-connected-to-a-github-codespace"></a>
## Use VSCode connected to a GitHub Codespace

GitHub's [Codespaces](https://github.com/features/codespaces) are machines that
are hosted in the cloud for you.

> [!IMPORTANT]
> You must connect your local VSCode to the codespace, you can not use VSCode in a browser window.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/reboot-dev/resemble-hello)
<br>
(Right-Click to open in new tab or window)

If you haven't [set your default editor to VSCode for codespaces](https://docs.github.com/en/codespaces/customizing-your-codespace/setting-your-default-editor-for-github-codespaces), then the 'Open in GitHub Codespaces' button above will end up opening VSCode in the browser. You can close that browser tab because _YOU MUST_ [open the existing codespace](https://docs.github.com/en/codespaces/developing-in-codespaces/opening-an-existing-codespace?tool=vscode) using the VSCode on your machine. You can also go to [https://github.com/codespaces](https://github.com/codespaces) and click the three dots next to the codespace you just created and then click `Open in ...` then `Open in Visual Studio Code`.

Now you're ready to [run the application](#run-the-application)!

<a id="use-vscode-with-a-local-dev-container"></a>
## Use VSCode with a local Dev Container

> [!IMPORTANT]
> Currently, our Dev Container at [`.devcontainer/devcontainer.json`](main/.devcontainer/devcontainer.json) **only works on x86 CPU architectures**.

If your machine meets the required specifications, you can start this
repository's Dev Container with VSCode locally rather than using a GitHub Codespace.

Clone this repository:

<!-- TODO: fetch this snippet from a test. -->

```shell
git clone https://github.com/reboot-dev/resemble-hello.git
```

Open the Dev Container:

- In VSCode, open the `resemble-hello` folder you've cloned.
- Press: Ctrl+Shift+P (Linux / Windows) or Command+Shift+P (Mac)
- Type/Select: `Dev Containers: Reopen In Container`

VSCode will now start the Dev Container and restart VSCode to be running
inside of that container.

Now you're ready to [run the application](#run-the-application)!

<a id="use-a-docker-container"></a>
## Use a Docker container

We've created a [Docker container](ghcr.io/reboot-dev/resemble-standalone) that _has all of the dependencies you need to build and run code in this repository already installed_.
> [!IMPORTANT]
> The Docker container currently **only works on x86 CPU architectures**. Check back soon for more supported architectures.

Clone this repository:

```shell
git clone https://github.com/reboot-dev/resemble-hello.git
cd resemble-hello/
```

Run the container:

```shell
export HOST_WORKING_DIRECTORY="$(pwd)"
export CONTAINER_WORKSPACE_DIRECTORY="/workspaces/$(basename $HOST_WORKING_DIRECTORY)"
docker run \
  --mount type=bind,source="$HOST_WORKING_DIRECTORY",target="$CONTAINER_WORKSPACE_DIRECTORY" \
  --workdir "$CONTAINER_WORKSPACE_DIRECTORY" \
  --env "HOST_UID=$(id -u)" \
  --env "HOST_GID=$(id -g)" \
  -p 127.0.0.1:3000:3000/tcp \
  -p 127.0.0.1:9991:9991/tcp \
  --privileged \
  --interactive \
  --tty \
  ghcr.io/reboot-dev/resemble-standalone:latest \
  /bin/bash
```

Explanation of flags:
* We --mount our --workdir (working directory), so we can work with it from the container.
* We tell the container about our user's UID and GID so that the container's
  user can match them, providing the same permissions inside and outside the
  container.
* We bind port 3000 so that we can access a React web front end (e.g., from a browser), and port 9991 so the web front end can access the Resemble backend.
* `--privileged` so that we can run Docker inside of the container.
* `--interactive` and `--tty` (often abbreviated `-it`) lets us interact with
  the created container.
* `ghcr.io/reboot-dev/resemble-standalone:latest` is the name of the container we'll be running.
* `/bin/bash` is the shell we'd like to run.

Now you're ready to [run the application](#run-the-application)!

<a id="install-prerequisites-manually"></a>
## Install prerequisites manually

> [!IMPORTANT]
> Resemble backends currently can run **on x86_64 Linux** machines with
> `glibc>=2.35` (Ubuntu Jammy and other equivalent-generation Linux
> distributions), and **on arm64/x86_64 MacOS**, where `MacOS>=13.0` and `Xcode>=14.3`. If you have a machine that doesn't fit this requirement, we
> suggest using one of the approaches discussed above.
### Prerequisites

You must have the following tools installed:

- Python (including `pip` and `venv`) >= 3.10
- Node.js (including `npm`)
- Docker

### Clone Repository

Clone this repository:

```shell
git clone https://github.com/reboot-dev/resemble-hello.git
cd resemble-hello/
```

### Create and activate a virtual environment

Create a new Python virtual environment in which to install Resemble
requirements and run an application:

```sh
python -m venv ./.resemble-hello-venv
source ./.resemble-hello-venv/bin/activate
```

To learn more about why virtual environments are a best practice for Python
projects, see [the Python documentation for the `venv` module.](https://docs.python.org/3/library/venv.html)

Now you're ready to [run the application](#run-the-application)!

<a id="run-the-application"></a>
## Run the application

### Backend via `rsm dev`

Our backend is implemented in Python and we must install its dependencies before
running it. The most notable of those dependencies is the `reboot-resemble` PyPI
distribution, which contains both the Resemble CLI (`rsm`) and the `resemble`
Python package.

```sh
pip install -r backend/src/requirements.txt
```

To run the application, you can now use the Resemble CLI `rsm`:

```shell
rsm dev
```

Running `rsm dev` will watch for file modifications and restart the
application if necessary. See the `.rsmrc` file for flags and
arguments that get expanded when running `rsm dev`.

### Front end

Similar to the backend, the front end has dependencies that need to be installed before running it. Open a separate terminal/shell and do:
```shell
cd web/
npm install
npm start
```
If using VSCode, the page will load automatically.
If not using VSCode, visit [http://127.0.0.1:3000](http://127.0.0.1:3000)`.

### Tests

The application comes with backend tests.

Before you run the tests, you'll
need to ensure you've run `rsm protoc`.  If you've already run `rsm dev`
without modifying `.rsmrc`, `rsm protoc` will have been run for you as
part of that command.
Otherwise, you can do it manually.

```sh
rsm protoc
```

`rsm protoc` will automatically make required Resemble '.proto'
dependencies like `resemble/v1alpha1/options.proto` available on the
import path without you having to check them into your own repository.

Now you can run the tests using `pytest`:

```sh
pytest backend/
```
