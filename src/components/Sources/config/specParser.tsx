import { AirbyteProperty, AirbyteSpec, FieldGroup, FormField } from './types';

export function parseAirbyteSpec(spec: AirbyteSpec): FieldGroup[] {
  const allFields = parseProperties(spec.properties, [], spec.required || []); // on a parent level (not nested oneOfs)
  console.log(allFields, 'allFields');
  // Sort fields by order
  allFields.sort((a, b) => (a.order || 0) - (b.order || 0));

  if (!spec.groups) {
    // If no groups defined, put all fields in a default group - from airbyte documentation.
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
  properties: Record<string, AirbyteProperty>, // this is the spec.properties, original specs that we get from backend.
  parentPath: string[] = [],
  required: string[] = []
): FormField[] {
  const fields: FormField[] = [];

  for (const [key, prop] of Object.entries(properties)) {
    // Skip hidden fields : Airbye documentation **Hiding inputs in the UI**
    if (prop.airbyte_hidden) {
      continue;
    }

    const path = [...parentPath, key]; // Field 1: path = ["credentials", "client_id"]
    // Controller name = "credentials.client_id"

    if (prop.oneOf) {
      //eg: as in mongodb: properties.database_config.oneOf
      // Handle oneOf fields (usually dropdowns/radio buttons)
      fields.push(parseOneOfField(key, prop, path, required.includes(key)));
    } else if (prop.type === 'array' && prop.items) {
      // Handle array fields with complex items
      fields.push(parseArrayField(key, prop, path, required.includes(key)));
    } else if (prop.type === 'object' && prop.properties) {
      // so oneOf is also type object. , but here were are checking that it should be oneOf and should have properties. type oneof is object but without properties.

      // Recursively handle nested objects especially for s3 bucket schema.
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
  key: string, // "ssl_mode"
  prop: AirbyteProperty, //  {ssl_mode: {one_of: []}} basically the object taht ssl mode has.
  path: string[], // path = [ "ssl_mode"] and
  isRequired: boolean // false
): FormField {
  const subFields: FormField[] = [];
  const enumOptions: { value: any; title: string; description?: string }[] = [];

  prop.oneOf?.forEach((option) => {
    //option is individual element of the oneOf array.
    // Find the const field that identifies this option
    // loops throught the oneOf array of objects.
    //each object has properties. So the object.entries will make the properties as [{key, value}, {key, value}]] and then it finds the const property.
    // [[cluster_type, {type: "string", const: "SELF_MANAGED_REPLICA_SET"}]].find(([key,prop]) => prop.const.) ** find returns the truthy value. hence it will return the whole array with key and prop. [cluster_type, {type: "string", const: "SELF_MANAGED_REPLICA_SET"}]
    const constField: any[] | undefined = Object.entries(option.properties).find(
      ([_, p]) => p.const
    ); //returns the first matching value.
    //so const key is unique but const value is different for each option.
    console.log('constField', constField);

    if (constField) {
      //this is array containing key and values as [key, {}].
      const [constKey, constProp] = constField; //[cluster_type, {type: "string", const: "SELF_MANAGED_REPLICA_SET"}]
      const constValue = constProp.const;

      // Add this option to the enum because the const values will form the options for the dropdown.
      enumOptions.push({
        value: constValue,
        title: option.title || constValue,
        description: option.description,
      });

      // Parse the option's other properties as sub-fields (excluding the const field)
      const optionRequired: string[] = Array.isArray(option.required) ? option.required : [];

      Object.entries(option.properties).forEach(([propKey, propDef]) => {
        // this goes through the properties of the values of the oneOf array. Each value === option.
        // so for postgres mode will already be in the constField.
        // Skip the const field itself
        console.log(propKey, 'propKey');
        if (propKey === constKey) return;

        const subFieldPath = [...path, propKey]; //[ssl_mode.client_key]
        console.log(subFields, 'subfields');
        // Handle nested oneOf fields recursively
        let subField: FormField;
        if (propDef.oneOf) {
          // This deep nested in for S3 bucket. Rest sources dont have very deep nested oneOf.
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

  console.log(enumOptions, 'enumOptions');
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
    displayType: prop.display_type || 'dropdown', // we create this and it will be dropdown only.
    enum: enumOptions.map((option) => option.value), //
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
  // for s3 we calculate subfields too.
  let subFields: FormField[] = [];

  // If array items are objects with properties, parse them
  // this is basically for s3 bucket schema. For postgres we have prop.items.type == string.
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
    id: path.join('.'), //we create
    type: 'array',
    path, //we create for form rendering.
    title: prop.title || key,
    description: prop.description,
    required: isRequired, // we calculate this.
    hidden: prop.airbyte_hidden, // Track hidden fields
    default: prop.default || [], //default value is usually is []here, but in string its ""
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
    id: path.join('.'), // Use full path for unique ID - we create.
    type: prop.type,
    path, // we create for form rendering.
    title: prop.title || key,
    description: prop.description,
    required: isRequired, // we calculate this.
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

// id - Generated unique identifier
// path - Array representing field hierarchy, that we can join and use as a controller name.
// parentValue -.
// subFields -
// enumOptions -
