#!/bin/sh

_GROUP_NAME="edrlab"
_PROFILE_NAME="test"
_PROFILE_MODE="dev"
_USERNAME="test2" # the username must not be used by an another profile
_PASSWORD="edrlab"
_GIT_CUSTOMIZATION_PROFILE_DATA_REPO="https://github.com/edrlab/customization-profile-data.git"
_GIT_PATH="/tmp/git-customization-profile-data-repo"
_BRANCH_NAME="group--$_GROUP_NAME--profile--$_PROFILE_NAME--$_PROFILE_MODE"

echo $PWD
_PWD=$PWD

set -xe

if [[ $(basename "$PWD") != "new-customer-scripts" ]]; then
    echo "not in the directory front-end"
    exit 1
fi

echo "remove if exists the GIT TMP PATH=$_GIT_PATH"
rm -rf $_GIT_PATH || echo "KO"

git clone --depth 1 --no-single-branch $_GIT_CUSTOMIZATION_PROFILE_DATA_REPO $_GIT_PATH || echo "KO"

cd $_GIT_PATH

git branch || echo "NO BRANCH" || echo "ok"
git show-ref || echo "NO REF!!" || echo "ok"

if git show-ref --verify "refs/remotes/origin/$_BRANCH_NAME"; then
    echo "Branch '$_BRANCH_NAME' already exists."
    exit 1
fi

git checkout --orphan "$_BRANCH_NAME" && git rm -rf . && git clean -fdx && git commit --allow-empty -m "init" && git push origin $_BRANCH_NAME || echo "KO"

mkdir -p $_GIT_PATH/.github/workflows || echo "KO"

echo "setup the github action CI"
sed -e "s/{{__GROUP__}}/$_GROUP_NAME/g" \
 -e "s/{{__NAME__}}/$_PROFILE_NAME/g" \
 -e "s/{{__MODE__}}/$_PROFILE_MODE/g" \
 -e "s/{{__MODE__UPER__}}/${_PROFILE_MODE^^}/g" \
 "$_PWD/ci-template.yml" > $_GIT_PATH/.github/workflows/ci.yml || echo "KO"

git add $_GIT_PATH/.github/workflows/ci.yml && git commit -m "setup CI" && git push origin $_BRANCH_NAME || echo "KO"


# not used anymore, replaced with a secrets.json encoded and updated to cloud run with a github actions, see https://github.com/edrlab/customization-profile-data/blob/main/secrets.json
# _SECRETS_PATH="$PWD/../front-end/src/secrets.json"
# _SECRETS_TMP_PATH="/tmp/__secrets__tmp__.json"
# echo "Writting to the front-end secrets.json file PATH=$_SECRETS_PATH"
# _USER_ID=$(jq -r '.users | length' $_SECRETS_PATH)
# ((_USER_ID++))
# jq -r "if (.users | any(.group == \"$_GROUP_NAME\" and .profile == \"$_PROFILE_NAME\")) then . else .users += [{\"id\": $_USER_ID, \"group\": \"$_GROUP_NAME\", \"profile\": \"$_PROFILE_NAME\", \"username\": \"$_USERNAME\", \"password\": \"$_PASSWORD\"}] end" $_SECRETS_PATH > $_SECRETS_TMP_PATH || echo "KO" && echo "OK" #| tee $_SECRETS_PATH

# cat $_SECRETS_TMP_PATH
# cat $_SECRETS_PATH

# cp $_SECRETS_TMP_PATH $_SECRETS_PATH
# rm $_SECRETS_TMP_PATH

# cat $_SECRETS_PATH