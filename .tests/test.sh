#!/bin/bash

set -e # Exit if a command exits with an error.
set -u # Treat expanding an unset variable as an error.
set -x # Echo executed commands to help debug failures.

# Check that this script has been invoked with the right working directory, by
# checking that the expected subdirectories exist.
ls -l api/ backend/src/ web/ 2> /dev/null > /dev/null || {
  echo "ERROR: this script must be invoked from the root of the 'resemble-hello' repository."
  echo "Current working directory is '$(pwd)'."
  exit 1
}

# Create and activate a virtual environment so that we don't pollute the
# system's Python installation.
VENV="./.resemble-hello-venv"
python -m venv $VENV
source $VENV/bin/activate

# If `REBOOT_RESEMBLE_WHL_FILE` is set, have it refer to an absolute non-symlink
# (= canonical) path.
if [ -v REBOOT_RESEMBLE_WHL_FILE ]; then
  REBOOT_RESEMBLE_WHL_FILE=$(readlink --canonicalize $REBOOT_RESEMBLE_WHL_FILE)
fi

# Normally, tests will use the published Resemble PyPI package; this is what
# happens when this test is run from `.github/workflows/*.yml`.
#
# However, when there is a need to test changes to the Resemble package itself,
# the test system can override the default and use an explicit local wheel file
# instead.
REBOOT_RESEMBLE_PACKAGE=${REBOOT_RESEMBLE_WHL_FILE:-"reboot-resemble"}

# Manually install the Resemble pip package before installing the
# requirements.txt. This allows us to install unreleased versions of
# the Resemble package during tests.
pip install $REBOOT_RESEMBLE_PACKAGE

# Save the pip show info on the package so that we can compare it after
# installing the rest of the requirements, to check that our custom whl hasn't
# been overwritten.
resemble_info=$(pip show reboot-resemble)

pip install -r backend/src/requirements.txt

# Double check that we haven't reinstalled another version of the
# reboot-resemble package.
if [ "$resemble_info" != "$(pip show reboot-resemble)" ]; then
  echo "ERROR: reboot-resemble whl overwritten by pip install. Are the package versions out of sync?"
  exit 1
fi

rsm protoc

mypy --python-executable=$VENV/bin/python backend/

pytest backend/

# Confirm that we can build the Docker image.
#
# We will only do this if this machine has the `docker` command installed. That
# means this is skipped on e.g. GitHub's Mac OS X runners.
if command -v docker &> /dev/null; then
  # Since Docker can't follow symlinks to files outside the build context, we
  # can't build the Docker image in a directory where the Dockerfile is a symlink.
  # That situation occurs when e.g. running this test on Bazel. Follow the symlink
  # back to the original directory and build from there.
  pushd $(dirname $(readlink --canonicalize ./Dockerfile))
  ./build.sh "reboot-dev/resemble-hello"
  popd
fi


# Clean up.
rm -rf ./.resemble-hello-venv
