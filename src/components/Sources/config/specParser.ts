import { AirbyteProperty, AirbyteSpec, FieldGroup, FormField } from './types';

export function parseAirbyteSpec(spec: AirbyteSpec): FieldGroup[] {
  const allFields = parseProperties(spec.properties, [], spec.required || []);

  // Sort fields by order
  allFields.sort((a, b) => (a.order || 0) - (b.order || 0));

  if (!spec.groups) {
    // If no groups defined, put all fields in a default group
    return [
      {
        id: 'default',
        fields: allFields,
      },
    ];
  }

  // Group fields based on spec groups
  return spec.groups.map((group) => ({
    id: group.id,
    title: group.title,
    fields: allFields.filter((field) => field.group === group.id),
  }));
}

function parseProperties(
  properties: Record<string, AirbyteProperty>,
  parentPath: string[] = [],
  required: string[] = []
): FormField[] {
  const fields: FormField[] = [];

  for (const [key, prop] of Object.entries(properties)) {
    const path = [...parentPath, key];

    if (prop.oneOf) {
      // Handle oneOf fields (usually dropdowns/radio buttons)
      fields.push(parseOneOfField(key, prop, path, required.includes(key)));
    } else if (prop.type === 'object' && prop.properties) {
      // Recursively handle nested objects
      const nestedRequired = Array.isArray(prop.required) ? prop.required : [];
      fields.push(...parseProperties(prop.properties, path, nestedRequired));
    } else {
      // Handle basic fields
      fields.push(parseBasicField(key, prop, path, required.includes(key)));
    }
  }

  return fields;
}

function parseOneOfField(
  key: string,
  prop: AirbyteProperty,
  path: string[],
  isRequired: boolean
): FormField {
  const subFields: FormField[] = [];
  const enumValues: any[] = [];

  prop.oneOf?.forEach((option) => {
    // Add the option's const/enum value to the parent's enum
    const constProp = Object.values(option.properties).find((p) => p.const);
    if (constProp?.const) {
      enumValues.push(constProp.const);
    }

    // Parse the option's other properties as sub-fields
    const optionRequired = Array.isArray(option.required) ? option.required : [];
    const optionFields = parseProperties(option.properties, path, optionRequired);

    // Filter out the const field that we used for the enum
    const relevantFields = optionFields.filter(
      (field) =>
        !Object.values(option.properties).find((p) => p.const && field.path.includes(p.const))
    );

    // Add parent value to each sub-field
    relevantFields.forEach((field) => {
      field.parentValue = constProp?.const;
      subFields.push(field);
    });
  });

  return {
    id: key,
    type: 'object',
    path,
    title: prop.title || key,
    description: prop.description,
    required: isRequired,
    displayType: prop.display_type || 'dropdown',
    enum: enumValues,
    subFields,
    order: prop.order || 0,
    group: prop.group,
  };
}

function parseBasicField(
  key: string,
  prop: AirbyteProperty,
  path: string[],
  isRequired: boolean
): FormField {
  return {
    id: key,
    type: prop.type,
    path,
    title: prop.title || key,
    description: prop.description,
    required: isRequired,
    secret: prop.airbyte_secret,
    default: prop.default,
    examples: prop.examples,
    pattern: prop.pattern,
    patternDescriptor: prop.pattern_descriptor,
    multiline: prop.multiline,
    enum: prop.enum,
    format: prop.format,
    minimum: prop.minimum,
    maximum: prop.maximum,
    alwaysShow: prop.always_show,
    order: prop.order || 0,
    group: prop.group,
  };
}
