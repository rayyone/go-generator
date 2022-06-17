/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

const role = {
  props: [
    // {{ry_placeholder:new_props}}
    {
      name: 'Name',
      goType: 'string',
      orgType: 'string',
      propKey: 'name',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
  ],
};
module.exports = role;
