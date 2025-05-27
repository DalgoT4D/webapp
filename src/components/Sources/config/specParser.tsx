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
    // Skip hidden fields
    if (prop.airbyte_hidden) {
      continue;
    }

    const path = [...parentPath, key];

    if (prop.oneOf) {
      // Handle oneOf fields (usually dropdowns/radio buttons)
      fields.push(parseOneOfField(key, prop, path, required.includes(key)));
    } else if (prop.type === 'array' && prop.items) {
      // Handle array fields with complex items
      fields.push(parseArrayField(key, prop, path, required.includes(key)));
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
  const enumOptions: { value: any; title: string; description?: string }[] = [];

  prop.oneOf?.forEach((option, index) => {
    // Find the const field that identifies this option
    const constField = Object.entries(option.properties).find(([_, p]) => p.const);

    if (constField) {
      const [constKey, constProp] = constField;
      const constValue = constProp.const;

      // Add this option to the enum
      enumOptions.push({
        value: constValue,
        title: option.title || constValue,
        description: option.description,
      });

      // Parse the option's other properties as sub-fields (excluding the const field)
      const optionRequired = Array.isArray(option.required) ? option.required : [];

      Object.entries(option.properties).forEach(([propKey, propDef]) => {
        // Skip the const field itself
        if (propKey === constKey) return;

        const subFieldPath = [...path, propKey];

        // Handle nested oneOf fields recursively
        let subField: FormField;
        if (propDef.oneOf) {
          subField = parseOneOfField(
            propKey,
            propDef,
            subFieldPath,
            optionRequired.includes(propKey)
          );
        } else {
          subField = parseBasicField(
            propKey,
            propDef,
            subFieldPath,
            optionRequired.includes(propKey)
          );
        }

        // Add parent value to identify which option this sub-field belongs to
        subField.parentValue = constValue;

        // Make ID unique by including the parent path and const value
        subField.id = `${path.join('.')}.${constValue}.${propKey}`;

        subFields.push(subField);
      });
    }
  });

  // Sort sub-fields: first by order (if specified), then alphabetically by title
  subFields.sort((a, b) => {
    // Group by parent value first to keep related fields together
    if (a.parentValue !== b.parentValue) {
      return 0; // Don't change order between different parent values
    }

    // Within the same parent value, sort by order first
    const orderA = a.order || 999;
    const orderB = b.order || 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // If same order (or both undefined), sort alphabetically by title
    return (a.title || '').localeCompare(b.title || '');
  });

  return {
    id: path.join('.'), // Use full path for unique ID
    type: 'object',
    path,
    title: prop.title || key,
    description: prop.description,
    required: isRequired,
    hidden: prop.airbyte_hidden, // Track hidden fields
    displayType: prop.display_type || 'dropdown',
    enum: enumOptions.map((option) => option.value), // Keep simple array for backward compatibility
    enumOptions, // Store full option details for better rendering
    subFields,
    order: prop.order || 0,
    group: prop.group,
  };
}

function parseArrayField(
  key: string,
  prop: AirbyteProperty,
  path: string[],
  isRequired: boolean
): FormField {
  let subFields: FormField[] = [];

  // If array items are objects with properties, parse them
  if (prop.items?.type === 'object' && prop.items.properties) {
    const itemRequired = Array.isArray(prop.items.required) ? prop.items.required : [];
    subFields = parseProperties(prop.items.properties, [...path, '0'], itemRequired);

    // Sort sub-fields: first by order (if specified), then alphabetically by title
    subFields.sort((a, b) => {
      const orderA = a.order || 999;
      const orderB = b.order || 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // If same order (or both undefined), sort alphabetically by title
      return (a.title || '').localeCompare(b.title || '');
    });
  }

  return {
    id: path.join('.'),
    type: 'array',
    path,
    title: prop.title || key,
    description: prop.description,
    required: isRequired,
    hidden: prop.airbyte_hidden, // Track hidden fields
    default: prop.default || [],
    itemType: prop.items?.type || 'string',
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
    id: path.join('.'), // Use full path for unique ID
    type: prop.type,
    path,
    title: prop.title || key,
    description: prop.description,
    required: isRequired,
    secret: prop.airbyte_secret,
    hidden: prop.airbyte_hidden, // Track hidden fields
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
