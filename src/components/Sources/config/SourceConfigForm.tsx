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
  spec,
  initialValues = {},
  onChange,
}) => {
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
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
          // Handle arrays (like S3 streams)
          result[fullKey] = value.map((item, index) => {
            if (typeof item === 'object' && item !== null) {
              const processedItem = { ...item };

              // Process each item in the array
              Object.keys(item).forEach((itemKey) => {
                const itemValue = item[itemKey];

                if (typeof itemValue === 'object' && itemValue !== null) {
                  // Check for const values in nested objects (like format.filetype)
                  if (itemValue.filetype) processedItem[itemKey] = itemValue.filetype;
                  if (itemValue.cluster_type) processedItem[itemKey] = itemValue.cluster_type;
                  if (itemValue.auth_type) processedItem[itemKey] = itemValue.auth_type;
                  if (itemValue.method) processedItem[itemKey] = itemValue.method;
                  if (itemValue.header_definition_type)
                    processedItem[itemKey] = itemValue.header_definition_type;

                  // Flatten other properties to the item level
                  Object.keys(itemValue).forEach((subKey) => {
                    if (
                      ![
                        'filetype',
                        'cluster_type',
                        'auth_type',
                        'method',
                        'header_definition_type',
                      ].includes(subKey)
                    ) {
                      const nestedPath = `${fullKey}.${index}.${itemKey}.${subKey}`;
                      result[nestedPath] = itemValue[subKey];
                    }
                  });
                }
              });

              return processedItem;
            }
            return item;
          });
        } else if (typeof value === 'object' && value !== null) {
          // For objects, check if they have common const field names
          if (value.cluster_type) result[fullKey] = value.cluster_type;
          if (value.auth_type) result[fullKey] = value.auth_type;
          if (value.method) result[fullKey] = value.method;
          if (value.filetype) result[fullKey] = value.filetype;
          if (value.header_definition_type) result[fullKey] = value.header_definition_type;

          // Also flatten the object properties to the form level
          Object.keys(value).forEach((subKey) => {
            if (
              ![
                'cluster_type',
                'auth_type',
                'method',
                'filetype',
                'header_definition_type',
              ].includes(subKey)
            ) {
              result[`${fullKey}.${subKey}`] = value[subKey];
            }
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
    const groups = parseAirbyteSpec(spec);
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
      const newSelectedValues: Record<string, any> = {};
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
