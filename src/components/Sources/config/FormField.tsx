import React, { useState } from 'react';
import { FormField as FormFieldType } from './types';
import { Controller, useFormContext, ValidationRule } from 'react-hook-form';
import {
  Autocomplete,
  Box,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
  InputLabel,
  Typography,
  Button,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';

interface FormFieldProps {
  field: FormFieldType;
  parentValue?: any;
}

export const FormField: React.FC<FormFieldProps> = ({ field, parentValue }) => {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  // Don't render hidden fields
  if (field.hidden) {
    return null;
  }

  // Only show field if it has no parent value or matches parent value
  if (field.parentValue !== undefined && field.parentValue !== parentValue) {
    return null;
  }

  const fieldPath = field.path.join('.');

  // Create the label content with consistent platform styling
  const labelText = field.title;
  const isRequired = field.required;

  // Component to render field label with description using platform styling
  const FieldLabel: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <InputLabel>
        {labelText}
        {isRequired && '*'}
        {!isRequired && ' (optional)'}
      </InputLabel>
      {field.description && (
        <Box sx={{ ml: 'auto' }}>
          <InfoTooltip title={field.description} />
        </Box>
      )}
      {children}
    </Box>
  );

  // Component to wrap child fields in a nice visual container
  const ChildFieldsContainer: React.FC<{ children: React.ReactNode; title?: React.ReactNode }> = ({
    children,
    title,
  }) => (
    <Box
      sx={{
        mt: 2,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: 'grey.50',
        position: 'relative',
      }}
    >
      {children}
    </Box>
  );

  // Handle oneOf fields (dropdowns/radio buttons)
  if (field.type === 'object' && field.enum) {
    return (
      <Box sx={{ mb: 2 }}>
        <Controller
          name={fieldPath}
          control={control}
          defaultValue={field.default}
          rules={{ required: field.required && `${field.title} is required` }}
          render={({ field: { value, onChange }, fieldState: { error } }) => {
            // For oneOf fields, the value might be an object with the const value
            // We need to extract the const value to match against our enum
            let selectedValue = value;

            if (typeof value === 'object' && value !== null) {
              // Try to find the const value in the object by checking each enum option
              const constValue = field.enum?.find((enumVal) => {
                // Check if this enum value exists as a property value in the object
                return Object.values(value).includes(enumVal);
              });
              selectedValue = constValue || null;
            }

            return (
              <>
                <FieldLabel />
                <Autocomplete
                  value={selectedValue}
                  onChange={(_, newValue) => {
                    // When a value is selected, we need to create the proper object structure
                    if (newValue) {
                      // For simple oneOf fields, just set the const value
                      // For complex oneOf fields with defaults, we might need to set more
                      const optionDetails = field.enumOptions?.find(
                        (opt) => opt.value === newValue
                      );

                      // Check if this field has defaults by looking at existing subFields
                      const hasSubFields = field.subFields?.some(
                        (sf) => sf.parentValue === newValue
                      );

                      if (hasSubFields) {
                        // For complex fields with sub-fields, set just the const value for now
                        // The sub-fields will handle their own values
                        onChange(newValue);
                      } else {
                        // For simple const-only fields, just set the value
                        onChange(newValue);
                      }
                    } else {
                      onChange(null);
                    }
                  }}
                  options={field.enum || []}
                  getOptionLabel={(option) => {
                    // Use the title from enumOptions if available, otherwise use the option value
                    const optionDetails = field.enumOptions?.find((opt) => opt.value === option);
                    return optionDetails?.title || option;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={`Select ${field.title.toLowerCase()}`}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                {/* Render sub-fields if they exist and match the selected value */}
                {field.subFields && field.subFields.length > 0 && selectedValue && (
                  <ChildFieldsContainer
                    title={`${field.enumOptions?.find((opt) => opt.value === selectedValue)?.title || selectedValue} Configuration`}
                  >
                    {field.subFields
                      .filter((subField) => subField.parentValue === selectedValue)
                      .map((subField) => (
                        <FormField key={subField.id} field={subField} parentValue={selectedValue} />
                      ))}
                  </ChildFieldsContainer>
                )}
              </>
            );
          }}
        />
      </Box>
    );
  }

  // Handle boolean fields
  if (field.type === 'boolean') {
    return (
      <Box sx={{ mb: 2 }}>
        <Controller
          name={fieldPath}
          control={control}
          defaultValue={field.default || false}
          render={({ field: { value, onChange } }) => (
            <Box>
              <FieldLabel />
              <FormControlLabel
                control={<Switch checked={value} onChange={(e) => onChange(e.target.checked)} />}
                label={value ? 'Enabled' : 'Disabled'}
                sx={{ ml: 0 }}
              />
            </Box>
          )}
        />
      </Box>
    );
  }

  // Handle array fields
  if (field.type === 'array') {
    return (
      <Box sx={{ mb: 2 }}>
        <Controller
          name={fieldPath}
          control={control}
          defaultValue={field.default || []}
          rules={{ required: field.required && `${field.title} is required` }}
          render={({ field: { value, onChange }, fieldState: { error } }) => {
            // For simple arrays (like string arrays)
            if (!field.subFields || field.subFields.length === 0) {
              return (
                <Box>
                  <FieldLabel />
                  <Autocomplete
                    multiple
                    freeSolo
                    value={value || []}
                    onChange={(_, newValue) => onChange(newValue)}
                    options={[]}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={`Add ${field.title.toLowerCase()}`}
                        error={!!error}
                        helperText={error?.message}
                      />
                    )}
                  />
                </Box>
              );
            }

            // For complex arrays like s3 bucket.
            const items = value || [];

            const addItem = () => {
              const newItem: Record<string, any> = {};
              // Set default values for required fields
              field.subFields?.forEach((subField) => {
                if (subField.required && subField.default !== undefined) {
                  const subPath = subField.path.slice(field.path.length + 1); // Remove the array path and index
                  if (subPath.length === 1) {
                    newItem[subPath[0]] = subField.default;
                  }
                }
              });
              onChange([...items, newItem]);
            };

            const removeItem = (index: number) => {
              const newItems = items.filter((_: any, i: number) => i !== index);
              onChange(newItems);
            };

            const updateItem = (index: number, itemData: Record<string, any>) => {
              const newItems = [...items];
              newItems[index] = { ...newItems[index], ...itemData };
              onChange(newItems);
            };

            return (
              <Box>
                <FieldLabel>
                  <Button onClick={addItem} variant="outlined" size="small" sx={{ ml: 'auto' }}>
                    Add {field.title?.replace(/s$/, '') || 'Item'}
                  </Button>
                </FieldLabel>

                {error && (
                  <Typography color="error" variant="caption" sx={{ mb: 1, display: 'block' }}>
                    {error.message}
                  </Typography>
                )}

                {items.map((item: any, index: number) => (
                  <ChildFieldsContainer
                    key={index}
                    title={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                        }}
                      >
                        <Typography variant="subtitle2" component="span">
                          {field.title?.replace(/s$/, '') || 'Item'} {index + 1}
                        </Typography>
                        <Button onClick={() => removeItem(index)} color="error" size="small">
                          Remove
                        </Button>
                      </Box>
                    }
                  >
                    {field.subFields?.map((subField) => {
                      // Create a new field with updated path for this array index
                      const indexedField = {
                        ...subField,
                        path: [
                          ...field.path,
                          index.toString(),
                          ...subField.path.slice(field.path.length + 1),
                        ],
                        id: `${field.path.join('.')}.${index}.${subField.id.split('.').slice(-1)[0]}`,
                      };

                      return (
                        <FormField
                          key={indexedField.id}
                          field={indexedField}
                          parentValue={parentValue}
                        />
                      );
                    })}
                  </ChildFieldsContainer>
                ))}

                {items.length === 0 && (
                  <Box
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No {field.title?.toLowerCase() || 'items'} configured. Click &quot;Add&quot;
                      to create one.
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          }}
        />
      </Box>
    );
  }

  // Handle basic fields (text, number, password)
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
          <Box>
            <FieldLabel />
            <TextField
              {...rest}
              fullWidth
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
              placeholder={`Enter ${field.title.toLowerCase()}`}
              InputProps={{
                endAdornment: field.secret && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      />
    </Box>
  );
};
