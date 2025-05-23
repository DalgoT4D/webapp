import React, { useState } from 'react';
import { FormField as FormFieldType } from './types';
import { Controller, useFormContext, ValidationRule } from 'react-hook-form';
import {
  Autocomplete,
  Box,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface FormFieldProps {
  field: FormFieldType;
  parentValue?: any;
}

export const FormField: React.FC<FormFieldProps> = ({ field, parentValue }) => {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  // Only show field if it has no parent value or matches parent value
  if (field.parentValue && field.parentValue !== parentValue) {
    return null;
  }

  const fieldPath = field.path.join('.');
  const label = `${field.title}${field.required ? '*' : ''}`;

  const renderDescription = () => {
    if (!field.description) return null;
    return (
      <Tooltip title={field.description}>
        <IconButton size="small" sx={{ ml: 1 }}>
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  if (field.type === 'boolean') {
    return (
      <Box sx={{ mb: 2 }}>
        <Controller
          name={fieldPath}
          control={control}
          defaultValue={field.default || false}
          render={({ field: { value, onChange } }) => (
            <FormControlLabel
              control={<Switch checked={value} onChange={(e) => onChange(e.target.checked)} />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {label}
                  {renderDescription()}
                </Box>
              }
            />
          )}
        />
      </Box>
    );
  }

  if (field.type === 'object' && field.enum) {
    return (
      <Box sx={{ mb: 2 }}>
        <Controller
          name={fieldPath}
          control={control}
          defaultValue={field.default}
          rules={{ required: field.required && `${field.title} is required` }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Autocomplete
              value={value}
              onChange={(_, newValue) => onChange(newValue)}
              options={field.enum || []}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label}
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {renderDescription()}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />
      </Box>
    );
  }

  if (field.type === 'array') {
    return (
      <Box sx={{ mb: 2 }}>
        <Controller
          name={fieldPath}
          control={control}
          defaultValue={field.default || []}
          rules={{ required: field.required && `${field.title} is required` }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Autocomplete
              multiple
              freeSolo
              value={value || []}
              onChange={(_, newValue) => onChange(newValue)}
              options={[]}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label}
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {renderDescription()}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />
      </Box>
    );
  }

  // Default to text input for strings and numbers
  return (
    <Box sx={{ mb: 2 }}>
      <Controller
        name={fieldPath}
        control={control}
        defaultValue={field.default || ''}
        rules={{
          required: field.required && `${field.title} is required`,
          pattern: field.pattern
            ? ({
                value: new RegExp(field.pattern),
                message: field.patternDescriptor || 'Invalid format',
              } as ValidationRule<RegExp>)
            : undefined,
          min: field.minimum,
          max: field.maximum,
        }}
        render={({ field: { value, onChange, ...rest }, fieldState: { error } }) => (
          <TextField
            {...rest}
            fullWidth
            label={label}
            value={value}
            onChange={(e) => {
              const val = field.type === 'number' ? Number(e.target.value) : e.target.value;
              onChange(val);
            }}
            type={
              field.secret && !showPassword
                ? 'password'
                : field.type === 'number'
                  ? 'number'
                  : 'text'
            }
            error={!!error}
            helperText={error?.message}
            multiline={field.multiline}
            rows={field.multiline ? 4 : 1}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {field.secret && (
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                    </IconButton>
                  )}
                  {renderDescription()}
                </InputAdornment>
              ),
            }}
          />
        )}
      />
    </Box>
  );
};
