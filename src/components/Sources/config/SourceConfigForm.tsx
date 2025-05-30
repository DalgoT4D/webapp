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
  const [selectedValues, setSelectedValues] = useState<Record<string, any>>({});

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

  // Watch for changes in form values
  useEffect(() => {
    const subscription = methods.watch((value) => {
      // Find all object fields with enums (oneOf fields)
      const oneOfFields = fieldGroups
        .flatMap((group) => group.fields)
        .filter((field) => field.type === 'object' && field.enum);

      // Update selected values for oneOf fields - extract const values for display
      const newSelectedValues: any = {};
      oneOfFields.forEach((field) => {
        const fieldPath = field.path.join('.');
        const fieldValue = value[fieldPath];

        // Extract const value from object for display
        if (fieldValue && typeof fieldValue === 'object') {
          // Find the const value in the object
          const constValue = Object.values(fieldValue).find((val) => field.enum?.includes(val));
          newSelectedValues[fieldPath] = constValue || null;
        } else {
          newSelectedValues[fieldPath] = fieldValue;
        }
      });

      setSelectedValues(newSelectedValues);

      // Notify parent of changes - send values as-is (backend format)
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
