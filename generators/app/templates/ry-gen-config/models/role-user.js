/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

const roleUser = {
  domain: 'auth',
  props: [
    // {{ry_placeholder:new_props}}
    {
      name: 'UserID',
      goType: 'string',
      orgType: 'string',
      propKey: 'user_id',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'RoleID',
      goType: 'string',
      orgType: 'string',
      propKey: 'role_id',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
  ],
};
module.exports = roleUser;
