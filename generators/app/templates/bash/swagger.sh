#!/bin/bash

#
# Copyright Rayyone Ltd. 2022. All Rights Reserved
# Node module: @rayyone/go-generator
# This file is licensed under the MIT License.
# License text available at https://opensource.org/licenses/MIT
#

function join_by {
  local IFS="$1"
  shift
  echo "$*"
}

# shellcheck disable=SC2207
all_dir=(
  "cmd/main"
  "app"
  $(ls -d app/domain/*/tfm)
)

dir_str=$(join_by , "${all_dir[@]}")

cmd="swag init -d $dir_str"
echo "$cmd" && eval "$cmd"
