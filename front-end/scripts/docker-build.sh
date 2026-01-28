
set -xe

# docker build -f dockerfile.node -t europe-west1-docker.pkg.dev/customization-profile/cloud-run-front-end-build/front-end-node:0.0.0.test --progress plain .

# docker build -f dockerfile.deno -t europe-west1-docker.pkg.dev/customization-profile/cloud-run-front-end-build/front-end-deno:0.0.0.test --progress plain .

docker build -f dockerfile.bun -t europe-west1-docker.pkg.dev/customization-profile/cloud-run-front-end-build/front-end-bun:0.0.0.test --progress plain .