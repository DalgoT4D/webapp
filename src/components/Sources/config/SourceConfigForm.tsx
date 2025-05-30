import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { AirbyteSpec, FieldGroup } from '@/helpers/connectorConfig/types';
import { FormGroup } from '@/helpers/connectorConfig/FormGroup';
import { parseAirbyteSpec } from '@/helpers/connectorConfig/specParser';

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

  const methods = useForm({
    defaultValues: initialValues, // Use values as-is from backend
  });

  // Parse spec into field groups
  useEffect(() => {
    const groups = parseAirbyteSpec(spec); // get the groups from the spec. All fields that share the same group value will be grouped into the same card in the UI
    console.log(groups, 'groups');
    setFieldGroups(groups);
  }, [spec]);

  // Set initial values when they change (for edit case)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // Reset form with new values
      methods.reset(initialValues);
    }
  }, [initialValues, methods]);

  // Watch for changes in form values - only notify parent, don't update local state
  useEffect(() => {
    const subscription = methods.watch((value) => {
      // Notify parent of changes - send values as-is (backend format)
      if (onChange) {
        onChange(value);
      }
    });

    return () => subscription.unsubscribe();
  }, [methods, onChange]);

  return (
    <FormProvider {...methods}>
      <Box>
        {fieldGroups.map((group) => (
          <FormGroup key={group.id} group={group} />
        ))}
      </Box>
    </FormProvider>
  );
};

/**
 * 1. check extractConstValues and parseAirbyteSpec functions.
 */
