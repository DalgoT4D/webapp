import React from 'react';
import { Box, Typography } from '@mui/material';
import { FieldGroup } from './types';
import { FormField } from './FormField';

interface FormGroupProps {
  group: FieldGroup;
  selectedValues: Record<string, any>;
}

export const FormGroup: React.FC<FormGroupProps> = ({ group, selectedValues }) => {
  return (
    <Box sx={{ mb: 4 }}>
      {group.title && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {group.title}
        </Typography>
      )}
      {group.fields.map((field) => {
        const fieldPath = field.path.join('.');
        return <FormField key={field.id} field={field} parentValue={selectedValues[fieldPath]} />;
      })}
    </Box>
  );
};
