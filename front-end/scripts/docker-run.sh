
set -axe
source .env
set +a

docker run --rm \
    -e PORT=8080 \
    -e __GIT_VOLUME="/git-volume" \
    -e __GITHUB_APP_PRIVATE_KEY="$__GITHUB_APP_PRIVATE_KEY" \
    -p 8080:8080 \
    --mount type=volume,src=git-volume,dst=/git-volume \
    europe-west1-docker.pkg.dev/customization-profile/cloud-run-front-end-build/front-end-node:0.0.0.test
