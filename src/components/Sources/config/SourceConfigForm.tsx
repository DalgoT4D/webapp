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

    Object.keys(values).forEach((key) => {
      const value = values[key];
      if (typeof value === 'object' && value !== null) {
        // For objects, check if they have common const field names
        if (value.cluster_type) result[key] = value.cluster_type;
        if (value.auth_type) result[key] = value.auth_type;
        if (value.method) result[key] = value.method;
        // Add other common const field patterns as needed

        // Also flatten the object properties to the form level
        Object.keys(value).forEach((subKey) => {
          if (subKey !== 'cluster_type' && subKey !== 'auth_type' && subKey !== 'method') {
            result[`${key}.${subKey}`] = value[subKey];
          }
        });
      }
    });

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
