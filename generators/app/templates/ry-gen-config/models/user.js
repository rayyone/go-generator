/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

const user = {
  props: [
    // {{ry_placeholder:new_props}}
    {
      name: 'Name',
      goType: '*string',
      orgType: 'string',
      propKey: 'name',
      isRequired: false,
      filterable: true,
      filterType: 'ilike',
    },
    {
      name: 'Email',
      goType: 'string',
      orgType: 'string',
      propKey: 'email',
      isRequired: true,
      filterable: true,
      filterType: 'ilike',
    },
    {
      name: 'ProfilePicture',
      goType: '*string',
      orgType: 'string',
      propKey: 'profile_picture',
      isRequired: false,
      filterable: false,
      filterType: '',
    },
    {
      name: 'IsVerified',
      goType: '*bool',
      orgType: 'bool',
      propKey: 'is_verified',
      isRequired: false,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'Password',
      goType: '*string',
      orgType: 'string',
      propKey: 'password',
      isRequired: false,
      filterType: '',
    },
  ],
};
module.exports = user;
