import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { AirbyteSpec, FieldGroup } from './types';
import { FormGroup } from './FormGroup';
import { parseAirbyteSpec } from './specParser';

interface SourceConfigFormProps {
  spec: AirbyteSpec;
  initialValues?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
}

export const SourceConfigForm: React.FC<SourceConfigFormProps> = ({
  spec, // individual source spec taht was selected.
  initialValues = {}, //empty object while creating a new source and pre-filled values while editing a source.
  onChange, // Callback function to notify parent component of changes
}) => {
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]); // Holds the parsed field groups from the spec
  const [selectedValues, setSelectedValues] = useState<Record<string, any>>({});

  // Simple function to extract const values from objects for oneOf fields
  const extractConstValues = (values: Record<string, any>): Record<string, any> => {
    const result = { ...values };

    const processObject = (obj: any, prefix = ''): void => {
      if (!obj || typeof obj !== 'object') return;

      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (Array.isArray(value)) {
          // Handle arrays
          result[fullKey] = value.map((item, index) => {
            if (typeof item === 'object' && item !== null) {
              const processedItem = { ...item };

              // Process each item in the array
              Object.keys(item).forEach((itemKey) => {
                const itemValue = item[itemKey];

                if (typeof itemValue === 'object' && itemValue !== null) {
                  // Look for any const fields dynamically
                  const constField = Object.entries(itemValue).find(
                    ([_, prop]: [string, any]) =>
                      typeof prop === 'object' && prop !== null && 'const' in prop
                  );

                  if (constField) {
                    const [constKey, constProp] = constField;
                    processedItem[itemKey] = (constProp as any).const;
                  }

                  // Flatten other properties to the item level
                  Object.keys(itemValue).forEach((subKey) => {
                    const nestedPath = `${fullKey}.${index}.${itemKey}.${subKey}`;
                    result[nestedPath] = itemValue[subKey];
                  });

                  // Recursively process nested objects for deeply nested structures
                  processObject(itemValue, `${fullKey}.${index}.${itemKey}`);
                }
              });

              return processedItem;
            }
            return item;
          });
        } else if (typeof value === 'object' && value !== null) {
          // For objects, look for const fields dynamically
          const constField = Object.entries(value).find(
            ([_, prop]: [string, any]) =>
              typeof prop === 'object' && prop !== null && 'const' in prop
          );

          if (constField) {
            const [constKey, constProp] = constField;
            result[fullKey] = (constProp as any).const;
          }

          // Also flatten the object properties to the form level
          Object.keys(value).forEach((subKey) => {
            result[`${fullKey}.${subKey}`] = value[subKey];
          });

          // Recursively process nested objects
          processObject(value, fullKey);
        }
      });
    };

    processObject(values);
    return result;
  };

  const methods = useForm({
    defaultValues: extractConstValues(initialValues),
  });

  // Parse spec into field groups
  useEffect(() => {
    const groups = parseAirbyteSpec(spec); // get the groups from the spec. All fields that share the same group value will be grouped into the same card in the UI
    console.log(groups, 'groups');
    setFieldGroups(groups);
  }, [spec]);

  // Watch for changes in form values
  useEffect(() => {
    const subscription = methods.watch((value) => {
      // Find all object fields with enums (oneOf fields)
      const oneOfFields = fieldGroups
        .flatMap((group) => group.fields)
        .filter((field) => field.type === 'object' && field.enum);

      // Update selected values for oneOf fields
      const newSelectedValues: any = {};
      oneOfFields.forEach((field) => {
        const fieldPath = field.path.join('.');
        newSelectedValues[fieldPath] = value[fieldPath];
      });

      setSelectedValues(newSelectedValues);

      // Notify parent of changes
      if (onChange) {
        onChange(value);
      }
    });

    return () => subscription.unsubscribe();
  }, [methods, fieldGroups, onChange]);

  return (
    <FormProvider {...methods}>
      <Box>
        {fieldGroups.map((group) => (
          <FormGroup key={group.id} group={group} selectedValues={selectedValues} />
        ))}
      </Box>
    </FormProvider>
  );
};

/**
 * 1. check extractConstValues and parseAirbyteSpec functions.
 */
