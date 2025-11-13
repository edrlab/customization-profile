#!/bin/sh

_GROUP_NAME="thorium-university"
_PROFILE_NAME="generic"
_USERNAME="thorium"
_PASSWORD="edrlab"
_GIT_CUSTOMIZATION_PROFILE_DATA_REPO="https://github.com/panaC/customization-profile-data.git"
_GIT_PATH="/tmp/git-customization-profile-data-repo"
_SECRETS_PATH="$PWD/src/secrets.json"
echo $PWD

set -xe

if [[ $(basename "$PWD") != "front-end" ]]; then
    echo "not in the directory front-end"
    exit 1
fi

rm -rf $_GIT_PATH

git clone --depth 1 --no-single-branch $_GIT_CUSTOMIZATION_PROFILE_DATA_REPO $_GIT_PATH

cd $_GIT_PATH

git branch
git show-ref

_BRANCH_NAME="_group/$_GROUP_NAME/profile/$_PROFILE_NAME/dev"
if git show-ref --verify "refs/remotes/origin/$_BRANCH_NAME"; then
    echo "Branch '$_BRANCH_NAME' already exists."
    exit 1
fi

git checkout --orphan "$_BRANCH_NAME" && git commit --allow-empty -m "init" && git push origin $_BRANCH_NAME

_USER_ID=$(jq -r '.users | length' $_SECRETS_PATH)
((_USER_ID++))
jq -r ".users += [{\"id\": $_USER_ID, \"group\": \"$_GROUP_NAME\", \"profile\": \"$_PROFILE_NAME\", \"username\": \"$_USERNAME\", \"password\": \"$_PASSWORD\"}]" $_SECRETS_PATH > /tmp/a #| tee $_SECRETS_PATH

cat /tmp/a
cat $_SECRETS_PATH

cp /tmp/a $_SECRETS_PATH
rm /tmp/a

cat $_SECRETS_PATH