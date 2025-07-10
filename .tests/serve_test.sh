#!/bin/bash

set -e # Exit if a command exits with an error.
set -x # Echo executed commands to help debug failures.

# Check that this script has been invoked with the right working directory, by
# checking that the expected subdirectories exist.
ls -l api/ backend/src/ web/ Dockerfile 2> /dev/null > /dev/null || {
  echo "ERROR: this script must be invoked from the root of the 'reboot-hello' repository."
  echo "Current working directory is '$(pwd)'."
  exit 1
}

get_reboot_version_from() {
  version=$(egrep -o 'reboot==[.0-9]+' $1 | head -n 1)
  if [ -z "$version" ]; then
    echo "No reboot version found in $1."
    exit 1
  fi
  echo $version
}

# During Reboot's release process, consumed versions (but not lockfiles) have
# been updated everywhere. During that period, our image claims to consume a
# a version which does not yet exist. Rather than adding a bunch of conditionals to
# our Dockerfile, which would make it harder to grok, we skip this test while the
# lockfile is out of sync. See #3495.
if [[ $(get_reboot_version_from "pyproject.toml") != $(get_reboot_version_from "requirements.lock") ]]; then
  echo "Lockfile does not match pyproject.toml: assuming we're mid-publish."
  exit 0
fi

# Use the published Reboot pip package by default, but allow the test system
# to override it with a different value. This is important even when using the
# `reboot-base` image with the `reboot` package already installed, since the
# `requirements.lock` file in this example might be out of date with the version
# of `reboot` used in that base image, and in particular may list the wrong
# dependencies.
if [ -n "$REBOOT_WHL_FILE" ]; then
  # Install the `reboot` package from the specified path explicitly, over-
  # writing the version from `pyproject.toml`.
  rye remove --no-sync reboot
  rye remove --no-sync --dev reboot
  rye add --dev reboot --absolute --path="${SANDBOX_ROOT}$REBOOT_WHL_FILE"
fi

stop_container() {
  if [ -n "$container_id" ]; then
    docker stop "$container_id"
  fi
}

perform_curl() {
  local url="localhost:8787/hello.v1.HelloMethods/Messages"
  local headers=(
    "-H" "x-reboot-state-ref:hello.v1.Hello:reboot-hello"
  )
  local actual_output_file="$1"

  # Discard the 'curl' exit code, since we want to continue even if the request fails.
  http_status=$(curl -v -s -o "$actual_output_file" -w "%{http_code}" -XPOST $url "${headers[@]}" || true)

  # Print the output of 'curl' to aid in debugging.
  cat "$actual_output_file"

  if [ "$http_status" -ne 200 ]; then
    return 1
  fi
  return 0
}

# Ensure the container is stopped on script exit
trap stop_container EXIT

# Confirm that we can build the Docker image.
#
# We will only do this if this machine has the `docker` command installed.
if command -v docker &> /dev/null; then
  # Since Docker can't follow symlinks to files outside the build context, we
  # can't build the Docker image in a directory where the Dockerfile is a symlink.
  # That situation occurs when e.g. running this test on Bazel. Follow the symlink
  # back to the original directory and build from there.
  pushd $(dirname $(readlink --canonicalize ./Dockerfile))
  # Build the "reboot-dev/reboot-hello" image.
  image_name="reboot-dev/reboot-hello"
  docker build -t $image_name .
  # Pick a port to run the container on. We can't use the default 9991, since in
  # tests on Reboot's GitHub Actions it is already in use by the devcontainer.
  container_id=$( \
    docker run \
      --env=PORT=8787 \
      --env=RBT_STATE_DIRECTORY=/app/state/ \
      -p8787:8787 \
      --detach \
      $image_name \
  )

  actual_output_file=$(mktemp)

  # Try to reach the backend.
  retries=0
  while ! perform_curl "$actual_output_file"; do
    if [ "$retries" -ge 30 ]; then
      # This is taking an unusually long time. Print the Docker logs to aid in
      # debugging.
      echo "###### Docker logs ######"
      docker logs $container_id
      echo "###### End Docker logs ######"
      retries=0
    fi
    sleep 1
    retries=$((retries+1))
  done

  # Check the output.
  if ! diff -u "${SANDBOX_ROOT}$EXPECTED_CURL_OUTPUT_FILE" "$actual_output_file"; then
    echo "The actual output does not match the expected output."
    exit 1
  fi

  rm "$actual_output_file"
  popd
else
  exit 1
fi
