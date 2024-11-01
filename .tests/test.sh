#!/bin/bash

set -e # Exit if a command exits with an error.
set -x # Echo executed commands to help debug failures.

# Check that this script has been invoked with the right working directory, by
# checking that the expected subdirectories exist.
ls -l api/ backend/src/ web/ 2> /dev/null > /dev/null || {
  echo "ERROR: this script must be invoked from the root of the 'reboot-hello' repository."
  echo "Current working directory is '$(pwd)'."
  exit 1
}

# MacOS tests can fail due to a race in `protoc` writing files to disk,
# so now we check only occurences of the expected lines in the output.
# See https://github.com/reboot-dev/respect/issues/3433
check_lines_in_file() {
  local expected="$1"
  local actual="$2"

  while IFS= read -r line; do
    if ! grep -Fxq "$line" "$actual"; then
      echo "Line $line is missing in the actual output."
      exit 1
    fi
  done < "$expected"
}

# Convert symlinks to files that we need to mutate into copies.
for file in "requirements.lock" "requirements-dev.lock" "pyproject.toml"; do
  cp "$file" "${file}.tmp"
  rm "$file"
  mv "${file}.tmp" "$file"
done

# Use the published Reboot pip package by default, but allow the test system
# to override them with a different value.
if [ -n "$REBOOT_WHL_FILE" ]; then
  # Install the `reboot` package from the specified path explicitly, over-
  # writing the version from `pyproject.toml`.
  rye remove --no-sync reboot
  rye remove --no-sync --dev reboot
  rye add --dev reboot --absolute --path=$REBOOT_WHL_FILE
fi

# Use the published Reboot npm package by default, but allow the test system
# to override them with a different value.
if [ -n "$REBOOT_NPM_PACKAGE" ]; then
  export REBOOT_NPM_PACKAGE=$(realpath "$REBOOT_NPM_PACKAGE")
fi

if [ -n "$REBOOT_API_NPM_PACKAGE" ]; then
  export REBOOT_API_NPM_PACKAGE=$(realpath "$REBOOT_API_NPM_PACKAGE")
fi

if [ -n "$REBOOT_REACT_NPM_PACKAGE" ]; then
  export REBOOT_REACT_NPM_PACKAGE=$(realpath "$REBOOT_REACT_NPM_PACKAGE")
fi

# Create and activate a virtual environment.
rye sync --no-lock
source .venv/bin/activate

# When running in a Bazel test, our `.rbtrc` file ends up in a very deep
# directory structure, which can result in "path too long" errors from RocksDB.
# Explicitly specify a shorter path.
RBT_FLAGS="--state-directory=$(mktemp -d)"

rbt $RBT_FLAGS protoc

mypy backend/

pytest backend/

if [ -n "$EXPECTED_RBT_DEV_OUTPUT_FILE" ]; then
  actual_output_file=$(mktemp)

  rbt $RBT_FLAGS dev run --terminate-after-health-check > "$actual_output_file"

  check_lines_in_file "$EXPECTED_RBT_DEV_OUTPUT_FILE" "$actual_output_file"

  rm "$actual_output_file"
fi

# Deactivate the virtual environment, since we can run a test which may require
# another virtual environment (currently we do that only in `all_tests.sh`).
deactivate
