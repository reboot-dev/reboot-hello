FROM ubuntu:jammy-20230804

### Resemble requirements.
# Resemble is built on Python and Node.js, so we need to install those.

# Ubuntu Jammy's default Python version is 3.10, which is also Resemble's
# minimum Python version.
ARG PYTHON_VERSION=3.10

ARG REBOOT_RESEMBLE_WHL_FILE

# Installs:
# * `curl` to support installation of `nvm` (below).
# * `python3` itself.
# * `python3-pip` to allow installing of python packages.
# * `python3-dev` and `build-essential` to allow `node-gyp` to build native Node
#                 modules, notably `@reboot-dev/resemble`.
# * `python-is-python3` to make sure we're using python3 (not python2).
# * `git` since the Resemble CLI relies on it to do its `.rsmrc` logic.
#
# TODO(rjh): we can probably reduce the final image size somewhat if we do
#            multi-stage builds, in which e.g. `python3-dev` and
#            `build-essential` are only installed during a build stage, and are
#            absent in the final runtime container - at the expense of a more
#            complex Dockerfile.
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  python3 \
  python3-pip \
  python3-dev \
  build-essential \
  python-is-python3 \
  git \
  # Confirm that python3 is installed and that it has the expected version.
  && python3 --version | grep -Eq "^Python ${PYTHON_VERSION}.*" \
  # And that "python" (aka python3) is installed and has the expected version.
  && python --version | grep -Eq "^Python ${PYTHON_VERSION}.*" \
  # Clean up, leaving a smaller layer.
  && rm -rf /var/lib/apt/lists/*

# We obtain Node via the Node Version Manager, following these instructions:
#   https://github.com/nvm-sh/nvm#installing-and-updating
ARG NVM_VERSION=0.39.5
ARG NODE_MAJOR_VERSION=18
ARG NVM_DIR=/usr/local/nvm

RUN mkdir $NVM_DIR && \
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh | NVM_DIR="$NVM_DIR" bash && \
  . "$NVM_DIR/nvm.sh" && \
  nvm install ${NODE_MAJOR_VERSION}

# Our container will run as `root`, so the root user must load `nvm` on login.
RUN echo ". $NVM_DIR/nvm.sh" >> /root/.bashrc

### Unpublished Resemble package.
# If you plan to use this Dockerfile for your own project, you may omit this
# section; it is useful only for Reboot's internal development. Outside of
# Reboot's internal development it is a no-op (it does nothing).
#
# During Reboot's own development, we may have unpublished Resemble packages
# that we'd like to test against this example. We place these in the following
# directory and install them before we do the `pip install` of the
# `requirements.txt`, which means these unpublished packages will always be
# prioritized over published ones.
#
# Since the following COPY uses a wildcard Docker is OK with the directory not
# existing at all, or being empty. The COPY will simply do nothing in those
# cases.
COPY .unpublished-*-wheel/*.whl .unpublished-resemble-wheel/
# If `.unpublished-resemble-wheel/` was empty or did not exist, the following
# `ls` will fail and instead of `pip install` we'll run `echo`, which means this
# RUN has no effects in that case.
RUN (ls ./.unpublished-resemble-wheel/*.whl && pip install ./.unpublished-resemble-wheel/*.whl) \
  || echo "No unpublished wheels to install."

### Our application.

# First ONLY copy and install the requirements, so that changes outside
# `requirements.txt` don't force a re-install of all dependencies.
#
# Note that this will install the Resemble library and CLI.
COPY backend/src/requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Next, copy the API definition and generate Resemble code. This step is also
# separate so it is only repeated if the `api/` code changes.
COPY api/ api/
COPY .rsmrc .rsmrc

# Run the Resemble code generators. We did copy all of `api/`, possibly
# including generated code, but it's not certain that `rsm protoc` was run in
# that folder before this build was started.
#
# Run `rsm` via an explicit `bash -i` invocation, so that `.bashrc` is loaded
# and `npm` can be found.
RUN bash -i -c "rsm protoc"

# Now copy the rest of the source code.
COPY backend/src/ backend/src/

# Running the application requires that we set the PYTHONPATH correctly.
CMD PYTHONPATH=api/ python3 backend/src/main.py
