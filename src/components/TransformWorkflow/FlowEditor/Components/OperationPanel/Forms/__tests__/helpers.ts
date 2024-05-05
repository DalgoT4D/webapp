import { SrcModelNodeType } from '../../../Canvas';

export const intermediateTableResponse = [
  {
    name: 'salinity',
    data_type: 'character varying',
  },
  {
    name: 'Multiple',
    data_type: 'character varying',
  },
  {
    name: 'Iron',
    data_type: 'character varying',
  },
  {
    name: 'Latitude',
    data_type: 'character varying',
  },
  {
    name: 'Longitude',
    data_type: 'character varying',
  },
  {
    name: 'Physical',
    data_type: 'character varying',
  },
  {
    name: 'Nitrate',
    data_type: 'character varying',
  },
  {
    name: 'State',
    data_type: 'character varying',
  },
  {
    name: 'District_Name',
    data_type: 'character varying',
  },
  {
    name: 'SNo_',
    data_type: 'character varying',
  },
  {
    name: '_airbyte_raw_id',
    data_type: 'character varying',
  },
  {
    name: '_airbyte_extracted_at',
    data_type: 'timestamp with time zone',
  },
  {
    name: '_airbyte_meta',
    data_type: 'jsonb',
  },
];

export const aggregateDbtModelResponse = {
  id: 'fake-id',
  output_cols: [
    '_airbyte_extracted_at',
    '_airbyte_meta',
    '_airbyte_raw_id',
    'Bacteriological',
    'District_Name',
    'Iron',
    'Latitude',
    'Longitude',
    'Multiple',
    'Nitrate',
    'Physical',
    'salinity',
    'SNo_',
    'State',
    'District aggregate',
  ],
  config: {
    config: {
      aggregate_on: [
        {
          operation: 'avg',
          column: 'District_Name',
          output_column_name: 'District aggregate',
        },
      ],
      source_columns: [
        '_airbyte_extracted_at',
        '_airbyte_meta',
        '_airbyte_raw_id',
        'Bacteriological',
        'District_Name',
        'Iron',
        'Latitude',
        'Longitude',
        'Multiple',
        'Nitrate',
        'Physical',
        'salinity',
        'SNo_',
        'State',
      ],
      other_inputs: [],
    },
    type: 'aggregate',
    input_models: [
      {
        uuid: 'fake-uuid',
        name: 'sheet2_mod2',
        display_name: 'sheet2_mod2',
        source_name: 'intermediate',
        schema: 'intermediate',
        type: 'source',
      },
    ],
  },
  type: 'operation_node',
  target_model_id: 'fake-model-d',
  seq: 1,
  chain_length: 1,
  is_last_in_chain: true,
};

export const mockNode = {
  id: 'fake-id',
  data: {
    id: 'fake-id',
    source_name: 'intermediate',
    input_name: 'sheet2_mod2',
    input_type: 'source',
    schema: 'intermediate',
    type: 'src_model_node',
  },
  type: 'src_model_node',
  xPos: 100,
  yPos: 200,
  selected: false,
  isConnectable: true,
  sourcePosition: 'bottom',
  targetPosition: 'top',
  dragging: false,
  zIndex: 0,
} as SrcModelNodeType;
