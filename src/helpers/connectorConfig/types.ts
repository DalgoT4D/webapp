export interface AirbyteProperty {
  type: string;
  title?: string;
  description?: string;
  airbyte_secret?: boolean;
  airbyte_hidden?: boolean;
  required?: boolean;
  order?: number;
  const?: any;
  default?: any;
  examples?: any[];
  pattern?: string;
  pattern_descriptor?: string;
  multiline?: boolean;
  enum?: any[];
  format?: string;
  minimum?: number;
  maximum?: number;
  properties?: Record<string, AirbyteProperty>;
  oneOf?: AirbyteOneOfOption[];
  items?: AirbyteProperty;
  display_type?: 'dropdown' | 'radio';
  always_show?: boolean;
  group?: string;
}

export interface AirbyteOneOfOption {
  title: string;
  description?: string;
  required?: string[];
  properties: Record<string, AirbyteProperty>;
}

export interface AirbyteSpec {
  type: string;
  title: string;
  $schema: string;
  required: string[];
  properties: Record<string, AirbyteProperty>;
  groups?: Array<{
    id: string;
    title?: string;
  }>;
}

export interface FormField {
  id: string;
  type: string;
  path: string[];
  title: string;
  description?: string;
  required: boolean;
  secret?: boolean;
  hidden?: boolean;
  default?: any;
  examples?: any[];
  pattern?: string;
  patternDescriptor?: string;
  multiline?: boolean;
  enum?: any[];
  constOptions?: { value: any; title: string; description?: string }[];
  format?: string;
  minimum?: number;
  maximum?: number;
  group?: string;
  displayType?: 'dropdown' | 'radio';
  alwaysShow?: boolean;
  subFields?: FormField[];
  parentValue?: any;
  order?: number;
  itemType?: string;
  constKey?: string;
}

export interface FieldGroup {
  id: string;
  title?: string;
  fields: FormField[];
}
