#!/bin/bash

set -e # Exit if a command exits with an error.
set -u # Treat expanding an unset variable as an error.
set -x # Echo executed commands to help debug failures.

# Check that this script has been invoked with the right working directory, by
# checking that the expected subdirectories exist.
ls -l api/ backend/src/ web/ 2> /dev/null > /dev/null || {
  echo "ERROR: this script must be invoked from the root of the 'resemble-hello-world' repository."
  echo "Current working directory is '$(pwd)'."
  exit 1
}

# Create and activate a virtual environment so that we don't pollute the
# system's Python installation.
python -m venv ./.hello-world-venv
source ./.hello-world-venv/bin/activate

# Use the published Resemble pip packages by default, but allow the test system
# to override them with a different value.
REBOOT_RESEMBLE_PACKAGE=${REBOOT_RESEMBLE_PACKAGE:-"reboot-resemble"}

# Manually install the Resemble packages before installing the requirements.txt.
# This allows us to install unreleased versions of the Resemble packages during
# tests; the requirements.txt refers to the released versions, but it will skip
# packages that have already been installed.
pip install $REBOOT_RESEMBLE_PACKAGE

pip install -r backend/src/requirements.txt

rsm protoc

pytest backend/

# Clean up
rm -rf ./.hello-world-venv
