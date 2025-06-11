import React from 'react';
import { Box, Typography } from '@mui/material';
import { FieldGroup } from './types';
import { FormField } from './FormField';

interface FormGroupProps {
  group: FieldGroup;
  fieldPathPrefix?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ group, fieldPathPrefix }) => {
  return (
    <Box sx={{ mb: 4 }}>
      {group.title && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {group.title}
        </Typography>
      )}
      {group.fields.map((field) => {
        return <FormField key={field.id} field={field} fieldPathPrefix={fieldPathPrefix} />;
      })}
    </Box>
  );
};
