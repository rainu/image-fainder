#!/bin/bash
SCRIPT_PATH=$(realpath "$0")
SCRIPT_NAME="$(basename "$(test -L "$0" && readlink "$0" || echo "$0")")"
SCRIPT_HOME=${SCRIPT_PATH%$SCRIPT_NAME}

VERSION=$1

if [[ -z "$VERSION" || ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Usage: $0 <version>"
  echo "Version must be in the format <major>.<minor>.<patch>"
  exit 1
fi

# Update the version in package.json
jq --arg version "$VERSION" '.version = $version' package.json > package.json.new && mv package.json.new package.json

git add package.json
git commit -m "release version: v${VERSION}"

git tag "v${VERSION}"
git push origin "v${VERSION}"