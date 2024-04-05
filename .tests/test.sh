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

# Convert symlinks to files that we need to mutate into copies.
for file in "requirements.lock" "requirements-dev.lock" "pyproject.toml"; do
  cp "$file" "${file}.tmp"
  rm "$file"
  mv "${file}.tmp" "$file"
done

# Use the published Resemble pip package by default, but allow the test system
# to override them with a different value.
if [ -v REBOOT_RESEMBLE_WHL_FILE ]; then
  # Install the `reboot-resemble` package from the specified path explicitly, over-
  # writing the version from `pyproject.toml`.
  rye remove --no-sync reboot-resemble
  rye remove --no-sync --dev reboot-resemble
  rye add --dev reboot-resemble --absolute --path=$REBOOT_RESEMBLE_WHL_FILE
fi

# Create and activate a virtual environment.
rye sync --no-lock
source .venv/bin/activate

rsm protoc

mypy backend/

pytest backend/

# Confirm that we can build the Docker image.
#
# We will only do this if this machine has the `docker` command installed. That
# means this is skipped on e.g. GitHub's Mac OS X runners.
if command -v docker &> /dev/null; then
  if [ -v REBOOT_RESEMBLE_WHL_FILE ]; then
    # If `REBOOT_RESEMBLE_WHL_FILE` is set, have it refer to an absolute non-symlink
    # (= canonical) path.
    REBOOT_RESEMBLE_WHL_FILE=$(readlink --canonicalize $REBOOT_RESEMBLE_WHL_FILE)
  fi
  # Since Docker can't follow symlinks to files outside the build context, we
  # can't build the Docker image in a directory where the Dockerfile is a symlink.
  # That situation occurs when e.g. running this test on Bazel. Follow the symlink
  # back to the original directory and build from there.
  pushd $(dirname $(readlink --canonicalize ./Dockerfile))
  ./build.sh "reboot-dev/resemble-hello"
  popd
fi

