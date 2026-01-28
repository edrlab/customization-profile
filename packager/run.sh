set -xe

set -a 
source ./.env
set +a


INPUT=$1
OUTPUT=$2

npm run cli -- --signed=false $INPUT $OUTPUT/notsigned
PUB_KEY=$DEV_PUBLIC_KEY PRIVATE_KEY=$DEV_PRIVATE_KEY npm run cli -- --signed=true $INPUT $OUTPUT/dev
PUB_KEY=$PROD_PUBLIC_KEY PRIVATE_KEY=$PROD_PRIVATE_KEY npm run cli -- --signed=true $INPUT $OUTPUT/prod
