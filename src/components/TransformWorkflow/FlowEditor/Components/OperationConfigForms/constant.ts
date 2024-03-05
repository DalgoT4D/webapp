export const RENAME_COLUMNS_OP = 'renamecolumns';
export const FLATTEN_OP = 'flatten';
export const FLATTEN_JSON_OP = 'flattenjson';
export const CAST_DATA_TYPES_OP = 'castdatatypes';
export const COALESCE_COLUMNS_OP = 'coalescecolumns';
export const ARITHMETIC_OP = 'arithmetic';
export const CONCAT_COLUMNS_OP = 'concat';
export const DROP_COLUMNS_OP = 'dropcolumns';
export const REGEX_EXTRACTION_OP = 'regexextraction';

export const operations = [
  { label: 'Flatten', slug: FLATTEN_OP },
  { label: 'Flatten json', slug: FLATTEN_JSON_OP },
  { label: 'Cast data type', slug: CAST_DATA_TYPES_OP },
  { label: 'Coalesce columns', slug: COALESCE_COLUMNS_OP },
  { label: 'Arithmetic', slug: ARITHMETIC_OP },
  { label: 'Concat', slug: CONCAT_COLUMNS_OP },
  { label: 'Drop columns', slug: DROP_COLUMNS_OP },
  { label: 'Rename columns', slug: RENAME_COLUMNS_OP },
  { label: 'Regex extraction', slug: REGEX_EXTRACTION_OP },
];
