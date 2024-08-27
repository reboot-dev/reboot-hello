FROM ghcr.io/reboot-dev/resemble-base:0.13.1

WORKDIR /app

# First ONLY copy and install the requirements, so that changes outside
# `requirements.txt` don't force a re-install of all dependencies.
COPY requirements.lock requirements.txt
RUN pip install -r requirements.txt

# Next, copy the API definition and generate Resemble code. This step is also
# separate so it is only repeated if the `api/` code changes.
COPY api/ api/
COPY .rsmrc .rsmrc

# Run the Resemble code generators. We did copy all of `api/`, possibly
# including generated code, but it's not certain that `rsm protoc` was run in
# that folder before this build was started.
RUN rsm protoc
# Now copy the rest of the source code.
COPY backend/src/ backend/src/

# Run `rsm serve` to get a production app!
# It is assumed that the `PORT` variable is provided at runtime (some platforms
# already do so by default).
CMD rsm serve --port=$PORT
