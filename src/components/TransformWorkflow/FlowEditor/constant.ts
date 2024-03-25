export const RENAME_COLUMNS_OP = 'renamecolumns';
export const FLATTEN_OP = 'flatten';
export const FLATTEN_JSON_OP = 'flattenjson';
export const CAST_DATA_TYPES_OP = 'castdatatypes';
export const COALESCE_COLUMNS_OP = 'coalescecolumns';
export const ARITHMETIC_OP = 'arithmetic';
export const CONCAT_COLUMNS_OP = 'concat';
export const DROP_COLUMNS_OP = 'dropcolumns';
export const REGEX_EXTRACTION_OP = 'regexextraction';
export const REPLACE_COLUMN_VALUE_OP = 'replace';
export const JOIN_OP = 'join';
export const WHERE_OP = 'where';
export const GROUPBY_OP = 'groupby';
export const AGGREGATE_OP = 'aggregate';
export const CASEWHEN_OP = 'casewhen';
export const UNION_OP = 'unionall';

export const operations = [
  { label: 'Flatten json', slug: FLATTEN_JSON_OP },
  { label: 'Cast', slug: CAST_DATA_TYPES_OP },
  { label: 'Coalesce', slug: COALESCE_COLUMNS_OP },
  { label: 'Arithmetic', slug: ARITHMETIC_OP },
  { label: 'Concat', slug: CONCAT_COLUMNS_OP },
  { label: 'Drop', slug: DROP_COLUMNS_OP },
  { label: 'Rename', slug: RENAME_COLUMNS_OP },
  { label: 'Regex extraction', slug: REGEX_EXTRACTION_OP },
  { label: 'Join', slug: JOIN_OP },
  { label: 'Filter', slug: WHERE_OP },
  { label: 'Group By', slug: GROUPBY_OP },
  { label: 'Replace', slug: REPLACE_COLUMN_VALUE_OP },
  { label: 'Aggregate', slug: AGGREGATE_OP },
  { label: 'Case', slug: CASEWHEN_OP },
  { label: 'Table union', slug: UNION_OP },
].sort((a, b) => a.label.localeCompare(b.label));

// Node types
export const SRC_MODEL_NODE = 'src_model_node';
export const OPERATION_NODE = 'operation_node';
