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

  const methods = useForm({
    defaultValues: initialValues,
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
