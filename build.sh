#!/bin/bash
#
# A helper script to build and push a Docker image for this Resemble
# application, such that that image can be used with `rsm cloud up`.

set -e # Exit if a command exits with an error.
set -u # Treat expanding an unset variable as an error.

# Parse flags. Gratefully borrowed from:
#   https://stackoverflow.com/questions/192249
POSITIONAL_ARGS=()
PUSH=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --push)
      PUSH=true
      shift # past argument
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      POSITIONAL_ARGS+=("$1") # save positional arg
      shift # past argument
      ;;
  esac
done

if [ ${#POSITIONAL_ARGS[@]} != 1 ]; then
  echo "Usage: $0 <docker_image_name>"
  exit 1
fi
DOCKER_IMAGE_NAME=${POSITIONAL_ARGS[0]}

# The following is a little helper for developers working on the Resemble
# library. You likely won't need it if you're just using Resemble.
if [ -n "$REBOOT_RESEMBLE_WHL_FILE" ]; then
  # Place the wheel package in a place where the Docker build process can
  # reach it. That means placing it in the build context, meaning the
  # directory containing the `Dockerfile`, or a subdirectory. We'll create
  # the '.unpublished-resemble-wheel' directory for this purpose, if it does not
  # exist yet.
  mkdir -p ./.unpublished-resemble-wheel
  cp $REBOOT_RESEMBLE_WHL_FILE ./.unpublished-resemble-wheel/
  # Make sure the wheel is readable by the Docker build process, and
  # overwritable by ourselves for future builds.
  chmod 664 ./.unpublished-resemble-wheel/*.whl
else
  # Make sure there are no leftover wheels from previous builds that may have
  # used 'REBOOT_RESEMBLE_WHL_FILE'.
  rm -rf ./.unpublished-resemble-wheel
fi

# Build the Docker image.
CPU_ARCH=$(uname -m)
if [ "$CPU_ARCH" != "x86_64" ]; then
  # TODO(rjh, onexl): can we cross-build for x86_64 on other architectures?
  echo "You must build your Resemble Docker containers on an 'x86_64' machine architecture."
  echo "Your machine has the '$CPU_ARCH' architecture."
  exit 1
fi
echo "Running 'docker build'..."
docker build -t $DOCKER_IMAGE_NAME .

if [ "$PUSH" = false ]; then
  echo "Build complete!"
  exit 0
fi

# Push the Docker image to the registry.
echo "Running 'docker push'..."
docker push $DOCKER_IMAGE_NAME

# Tell the user how to safely `rsm cloud up` this image, instructing them to use
# the specific SHA to ensure that this exact version of the image is used.
DOCKER_IMAGE_NAME_WITH_SHA=$(docker inspect --format='{{index .RepoDigests 0}}' $DOCKER_IMAGE_NAME)
echo "Push complete!"
echo
echo "To run your image on the Resemble Cloud, run:"
echo
echo "  rsm cloud up --image-name=$DOCKER_IMAGE_NAME_WITH_SHA --api-key=YOUR_API_KEY"
echo
