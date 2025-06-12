import React, { useState } from 'react';
import { FormField as FormFieldType } from './types';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
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
  fieldPathPrefix?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  field,
  parentValue: propParentValue,
  fieldPathPrefix,
}) => {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  // Always call useWatch at the top level - hooks must be called unconditionally
  const parentSegments = field.path.slice(0, -1);
  const parentFieldPath = parentSegments.length ? parentSegments.join('.') : '';

  const parentFieldValue = useWatch({
    control,
    name: parentFieldPath,
    disabled: !parentSegments.length, // avoids subscribing to the whole form
  });

  // Don't render hidden fields
  if (field.hidden) {
    return null;
  }

  // Prefix the field path if fieldPathPrefix is provided
  const fieldPath = fieldPathPrefix
    ? `${fieldPathPrefix}.${field.path.join('.')}`
    : field.path.join('.');

  // For child fields (oneOf subfields), watch the parent field to get the current selected value
  let parentValue = propParentValue;

  if (field.parentValue !== undefined && !propParentValue) {
    // Find the parent field path by removing the last segment
    if (parentSegments.length) {
      // Extract the const value from the parent object
      if (parentFieldValue && typeof parentFieldValue === 'object') {
        parentValue = Object.values(parentFieldValue).find(
          (val) => typeof val === 'string' || typeof val === 'number'
        );
      } else {
        parentValue = parentFieldValue;
      }
    }
  }

  // Only show field if it has no parent value requirement or matches parent value
  if (field.parentValue !== undefined && field.parentValue !== parentValue) {
    return null;
  }

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
      {title && <Box sx={{ mb: 2 }}>{title}</Box>}
      {children}
    </Box>
  );

  // Handle oneOf fields with const values (dropdowns that trigger sub-configurations)
  if (field.type === 'object' && field.constOptions) {
    return (
      <Box sx={{ mb: 2 }}>
        <Controller
          name={fieldPath}
          control={control}
          defaultValue={field.default}
          rules={{ required: field.required && `${field.title} is required` }}
          render={({ field: { value, onChange }, fieldState: { error } }) => {
            // Extract const value for display
            let selectedValue = null;
            const constValues = field.constOptions?.map((opt) => opt.value) || [];

            if (value && typeof value === 'object') {
              // Find the const value in the object
              selectedValue = Object.values(value).find((val) => constValues.includes(val)) || null;

              // Ensure the object structure is maintained
              if (selectedValue && field.constKey && !value[field.constKey]) {
                // If we have a selected value but incorrect structure, fix it
                const fixedValue = { [field.constKey]: selectedValue };
                onChange(fixedValue);
              }
            } else if (typeof value === 'string' && constValues.includes(value)) {
              // Handle case where value is already a string (for backwards compatibility)
              selectedValue = value;

              // Convert to proper object structure if needed
              if (field.constKey) {
                const fixedValue = { [field.constKey]: value };
                onChange(fixedValue);
              }
            }

            return (
              <>
                <FieldLabel />
                <Autocomplete
                  value={selectedValue}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      // Use the stored constKey from the field definition
                      if (field.constKey) {
                        // Create the proper object structure for backend
                        const objectValue = { [field.constKey]: newValue };
                        onChange(objectValue);
                      } else {
                        // Fallback for backwards compatibility
                        onChange(newValue);
                      }
                    } else {
                      onChange(null);
                    }
                  }}
                  options={constValues}
                  getOptionLabel={(option) => {
                    // Use the title from constOptions if available, otherwise use the option value
                    const optionDetails = field.constOptions?.find(
                      (opt: { value: any; title: string; description?: string }) =>
                        opt.value === option
                    );
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
                {selectedValue &&
                  field.subFields &&
                  (() => {
                    const matchingSubFields = field.subFields.filter(
                      (subField) => subField.parentValue === selectedValue
                    );

                    // Only render container if there are actual matching subfields
                    if (matchingSubFields.length === 0) {
                      return null;
                    }

                    return (
                      <ChildFieldsContainer
                        title={`${field.constOptions?.find((opt: { value: any; title: string; description?: string }) => opt.value === selectedValue)?.title || selectedValue} Configuration`}
                      >
                        {matchingSubFields.map((subField) => (
                          <FormField
                            key={subField.id}
                            field={subField}
                            parentValue={selectedValue}
                            fieldPathPrefix={fieldPathPrefix}
                          />
                        ))}
                      </ChildFieldsContainer>
                    );
                  })()}
              </>
            );
          }}
        />
      </Box>
    );
  }

  // Handle simple enum fields for string type (dropdown with no sub-configurations)
  if (field.type === 'string' && field.enum) {
    return (
      <Box sx={{ mb: 2 }}>
        <Controller
          name={fieldPath}
          control={control}
          defaultValue={field.default || ''}
          rules={{ required: field.required && `${field.title} is required` }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Box>
              <FieldLabel />
              <Autocomplete
                value={value || ''}
                onChange={(_, newValue) => onChange(newValue || '')}
                options={field.enum || []}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={`Select ${field.title.toLowerCase()}`}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Box>
          )}
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
          rules={{ required: field.required && `${field.title} is required` }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Box>
              <FieldLabel />
              <FormControlLabel
                control={<Switch checked={value} onChange={(e) => onChange(e.target.checked)} />}
                label={value ? 'Enabled' : 'Disabled'}
                sx={{ ml: 0 }}
              />
              {error && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {error.message}
                </Typography>
              )}
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

              // Helper function to set nested value
              const setNestedValue = (path: string[], value: any) => {
                let current = newItem;
                // Navigate to the parent object
                for (let i = 0; i < path.length - 1; i++) {
                  const part = path[i];
                  if (!(part in current)) {
                    current[part] = {};
                  }
                  current = current[part];
                }
                // Set the value at the final path
                const lastPart = path[path.length - 1];
                current[lastPart] = value;
              };

              // Set default values for required fields
              field.subFields?.forEach((subField) => {
                if (subField.required && subField.default !== undefined) {
                  const subPath = subField.path.slice(field.path.length + 1); // Remove the array path and index
                  setNestedValue(subPath, subField.default);
                }
              });

              onChange([...items, newItem]);
            };

            const removeItem = (index: number) => {
              const newItems = items.filter((_: any, i: number) => i !== index);
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
                    key={`${fieldPath}[${index}]`}
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
                        id: `${fieldPath}[${index}].${subField.path.slice(-1)[0]}`,
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
        defaultValue={field.default ?? ''}
        rules={{
          required: field.required && `${field.title} is required`,
          pattern: field.pattern
            ? ({
                value: new RegExp(field.pattern),
                message: field.patternDescriptor || 'Invalid format',
              } as any)
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
              value={value ?? ''}
              onChange={(e) => {
                let val: any = e.target.value;
                if (field.type === 'number' || field.type === 'integer') {
                  const input = e.target as HTMLInputElement;
                  val = input.valueAsNumber;
                  if (Number.isNaN(val)) val = undefined; // keep field empty
                }
                onChange(val);
              }}
              type={
                field.secret && !showPassword
                  ? 'password'
                  : field.type === 'number' || field.type === 'integer'
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
