# Resemble Hello World

For the impatient:
1. Get a suitable environment:
    * Use VSCode (on your machine)
        * [... connected to a GitHub Codespace](#use-vscode-connected-to-a-github-codespace)
        * [... with a local Dev Container](#use-vscode-with-a-local-dev-container)
    * [Use a Docker Container](#use-a-docker-container) _(Coming soon)_
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

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/reboot-dev/resemble-hello-world)
<br>
(Right-Click to open in new tab or window)

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
git clone https://github.com/reboot-dev/resemble-examples.git
```

Open the Dev Container:

- In VSCode, open the `resemble-examples` folder you've cloned.
- Press: Ctrl+Shift+P (Linux / Windows) or Command+Shift+P (Mac)
- Type/Select: `Dev Containers: Reopen In Container`

VSCode will now start the Dev Container and restart VSCode to be running
inside of that container.

Now you're ready to [run the application](#run-the-application)!

<a id="use-a-docker-container"></a>
## Use a Docker container

COMING SOON!

<a id="install-prerequisites-manually"></a>
## Install prerequisites manually

> [!IMPORTANT]
> Currently, Resemble backends can only run on x86 Linux machines with
> `glibc>=2.35` (Ubuntu Jammy and other equivalent-generation Linux
> distributions). If you have a machine that doesn't fit this requirement, we
> suggest using one of the approaches discussed above.
### Prerequisites

You must have the following tools installed:

- Python (including `pip` and `venv`) >= 3.10

### Clone Repository

Clone this repository:

```shell
git clone https://github.com/reboot-dev/resemble-examples.git
cd resemble-examples/
```

### Create and activate a virtual environment

Create a new Python virtual environment in which to install Resemble
requirements and run an application:

```sh
python -m venv ./.resemble-hello-world-venv
source ./.resemble-hello-world-venv/bin/activate
```

For extra environment isolation, you can make a virtual environment for each
application you want to run.

To learn more about why virtual environments are a best practice for Python
projects, see [the Python documentation for the `venv` module.](https://docs.python.org/3/library/venv.html)

### Install Resemble tooling

Install the Resemble command line tool (`rsm`) via `pip`. This package includes
the `rsm` CLI, the Resemble `protoc` plugin, the proto dependencies required for
Resemble definitions, and the `grpcio-tools` package that provides `protoc`.

```sh
pip install reboot-resemble-cli
```

Now you're ready to [run the application](#run-the-application)!

<a id="run-the-application"></a>
## Run the application

### Install Python Requirements

As with most Python applications, this example has requirements that must be
installed before the application can run successfully. These Python
requirements include the Resemble backend library, `reboot-resemble`.

```sh
pip install -r backend/src/requirements.txt
```

### `rsm dev`

To run the application, use the `rsm` CLI:

```shell
rsm dev
```

Running `rsm dev` will watch for file modifications and restart the
application if necessary. See the `.rsmrc` file for flags and
arguments that get expanded when running `rsm dev`.

### Front end

To run the front end, use the `run-npm` config option:
```shell
rsm dev --config=run-npm
```

This config adds a `--background-command` that installs the npm dependencies 
and starts the React DevServer. 

If you want to see separate log output, you can run `npm install` and 
`npm start` in a separate terminal without the `run-npm` config option.

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
