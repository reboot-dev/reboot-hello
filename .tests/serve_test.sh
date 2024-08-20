#!/bin/bash

set -e # Exit if a command exits with an error.
set -x # Echo executed commands to help debug failures.

# Check that this script has been invoked with the right working directory, by
# checking that the expected subdirectories exist.
ls -l api/ backend/src/ web/ Dockerfile 2> /dev/null > /dev/null || {
  echo "ERROR: this script must be invoked from the root of the 'resemble-hello' repository."
  echo "Current working directory is '$(pwd)'."
  exit 1
}

stop_container() {
  if [ -n "$container_id" ]; then
    docker stop "$container_id"
  fi
}

perform_curl() {
  local url="localhost:8787/hello.v1.HelloInterface/Messages"
  local headers=(
    "-H" "x-resemble-service-name:hello.v1.HelloInterface"
    "-H" "x-resemble-state-ref:hello.v1.Hello:resemble-hello"
  )
  local actual_output_file="$1"

  # Discard the 'curl' exit code, since we want to continue even if the request fails.
  http_status=$(curl -s -o "$actual_output_file" -w "%{http_code}" -XPOST $url "${headers[@]}" || true)

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
  # Build the "reboot-dev/resemble-hello" image.
  image_name="reboot-dev/resemble-hello"
  docker build -t $image_name .
  # Pick a port to run the container on. We can't use the default 9991, since in
  # tests on Reboot's GitHub Actions it is already in use by the devcontainer.
  container_id=$(docker run -e PORT=8787 -p8787:8787 --detach $image_name)

  actual_output_file=$(mktemp)

  # Try to reach the backend.
  while ! perform_curl "$actual_output_file"; do
    sleep 1
  done

  # Check the output.
  if ! diff -u "$EXPECTED_CURL_OUTPUT_FILE" "$actual_output_file"; then
    echo "The actual output does not match the expected output."
    exit 1
  fi

  rm "$actual_output_file"
  popd
else
  exit 1
fi
