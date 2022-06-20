/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

const permission = {
  domain: 'auth',
  props: [
    // {{ry_placeholder:new_props}}
    {
      name: 'Action',
      goType: 'string',
      orgType: 'string',
      propKey: 'action',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'Description',
      goType: '*string',
      orgType: 'string',
      propKey: 'description',
      isRequired: false,
      filterable: true,
      filterType: 'ilike',
    },
    {
      name: 'Module',
      goType: 'string',
      orgType: 'string',
      propKey: 'module',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
  ],
};
module.exports = permission;
