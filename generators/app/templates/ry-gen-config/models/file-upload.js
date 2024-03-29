
const fileUpload = {
  domain: 'file',
  props: [
// {{ry_placeholder:new_props}}
    {
      name: 'Meta',
      propKey: 'meta',
      orgType: 'datatypes.JSON',
      goType: '*datatypes.JSON',
      isRequired: false,
      isNullable: true,
      filterable: false,
      filterType: '',
    },

    {
      name: 'OwnerID',
      propKey: 'owner_id',
      orgType: 'string',
      goType: '*string',
      isRequired: false,
      isNullable: true,
      filterable: true,
      filterType: '=',
    },

    {
      name: 'FileableType',
      propKey: 'fileable_type',
      orgType: 'string',
      goType: 'string',
      isRequired: false,
      isNullable: true,
      filterable: true,
      filterType: 'ilike',
    },
    {
      name: 'FileableID',
      propKey: 'fileable_id',
      orgType: 'string',
      goType: 'string',
      isRequired: false,
      isNullable: true,
      filterable: true,
      filterType: '=',
    },

    {
      name: 'Name',
      propKey: 'name',
      orgType: 'string',
      goType: 'string',
      isRequired: true,
      isNullable: false,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'Path',
      propKey: 'path',
      orgType: 'string',
      goType: 'string',
      isRequired: true,
      isNullable: false,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'Url',
      propKey: 'url',
      orgType: 'string',
      goType: 'string',
      isRequired: true,
      isNullable: false,
      filterable: false,
      filterType: '',
    },
    {
      name: 'used',
      propKey: 'used',
      orgType: 'bool',
      goType: 'bool',
      isRequired: true,
      isNullable: false,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'Category',
      propKey: 'category',
      orgType: 'string',
      goType: 'string',
      isRequired: true,
      isNullable: false,
      filterable: true,
      filterType: '=',
    },

  ],
}
module.exports = fileUpload;
