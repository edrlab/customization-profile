#!/bin/bash

## Automatically generate a file with git branch and revision info
##
## Example:
##   [master]v2.0.0-beta-191(a830382)
## Install:
##   cp git-create-revisioninfo-hook.sh .git/hooks/post-commit
##   cp git-create-revisioninfo-hook.sh .git/hooks/post-checkout
##   cp git-create-revisioninfo-hook.sh .git/hooks/post-merge
##   chmod +x .git/hooks/post-*

FILENAME='front-end/gitrevision.json'

exec 1>&2
branch=`git rev-parse --abbrev-ref HEAD`
longhash=`git log --no-show-signature --pretty=format:'%H' -n 1`
shorthash=`git log --no-show-signature --pretty=format:'%h' -n 1`
revcount=`git log --no-show-signature --oneline | wc -l | tr -d ' '`
latesttag=`git describe --tags --abbrev=0 --always`

#VERSION="[$branch]$latesttag-$revcount($shorthash)"
#VERSION="[$branch]rev$revcount($shorthash)"
JSON="{\"branch\": \"$branch\", \"shorthash\": \"$shorthash\", \"longhash\": \"$longhash\", \"revcount\": \"$revcount\", \"latesttag\": \"$latesttag\"}"
echo $JSON > $FILENAME