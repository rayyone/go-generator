#!/bin/bash

#
# Copyright Rayyone Ltd. 2022. All Rights Reserved
# Node module: @rayyone/go-generator
# This file is licensed under the MIT License.
# License text available at https://opensource.org/licenses/MIT
#

if ! [ -d "redocly" ];
then
  echo "Redocly is not existed. Cloning into repo"
  clone="git clone https://github.com/rayyone/redocly-openapi.git redocly"
  echo "$clone" && eval "$clone"

  init="cd redocly && npm install && cd .."
  echo "$init" && eval "$init"
fi

cp="yes | cp docs/swagger.yaml redocly/openapi"
echo "$cp" && eval "$cp"