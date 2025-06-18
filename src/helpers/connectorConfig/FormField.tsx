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

                        // Find the selected option's sub-fields and set their default values
                        const selectedSubFields = field.subFields?.filter(
                          (subField) => subField.parentValue === newValue
                        );

                        // Add default values for all sub-fields of the selected option
                        if (selectedSubFields) {
                          selectedSubFields.forEach((subField) => {
                            const subFieldName = subField.path[subField.path.length - 1];
                            if (subField.default !== undefined) {
                              objectValue[subFieldName] = subField.default;
                            }
                          });
                        }

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

                    if (matchingSubFields.length === 0) return null;

                    return (
                      <ChildFieldsContainer
                        title={
                          <Typography variant="subtitle2">
                            {(field.constOptions?.find((opt) => opt.value === selectedValue)
                              ?.title || selectedValue) + ' Configuration'}
                          </Typography>
                        }
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

  // Handle enum fields (dropdowns)
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

            // For complex arrays like s3 streams
            const items = value || [];

            const addItem = () => {
              // Create a minimal item structure - only include absolutely required fields
              const newItem: Record<string, any> = {};

              // Only set defaults for fields that have explicit default values in the schema
              // Don't set empty defaults to avoid cluttering the form
              field.subFields?.forEach((subField) => {
                const fieldName = subField.path[subField.path.length - 1];

                // Only set explicit defaults from the schema, not empty defaults
                if (subField.default !== undefined) {
                  newItem[fieldName] = subField.default;
                }
                // Don't set any other default values - let users fill them as needed
              });

              onChange([...items, newItem]);
            };

            const removeItem = (index: number) => {
              const newItems = items.filter((_: any, i: number) => i !== index);
              onChange(newItems);
            };

            const updateItem = (index: number, fieldName: string, fieldValue: any) => {
              const newItems = [...items];
              if (!newItems[index]) {
                newItems[index] = {};
              }
              newItems[index][fieldName] = fieldValue;
              onChange(newItems);
            };

            // Special update function for nested oneOf fields
            const updateNestedField = (
              index: number,
              parentFieldName: string,
              nestedFieldName: string,
              fieldValue: any
            ) => {
              const newItems = [...items];
              if (!newItems[index]) {
                newItems[index] = {};
              }
              if (!newItems[index][parentFieldName]) {
                newItems[index][parentFieldName] = {};
              }

              // Ensure we preserve the parent object structure
              newItems[index][parentFieldName] = {
                ...newItems[index][parentFieldName],
                [nestedFieldName]: fieldValue,
              };

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
                      const fieldName = subField.path[subField.path.length - 1];
                      const currentValue = item[fieldName];

                      // Create a field component that handles the specific field type
                      const renderField = () => {
                        if (subField.type === 'object' && subField.constOptions) {
                          // Handle oneOf fields
                          let selectedValue = null;
                          const constValues = subField.constOptions?.map((opt) => opt.value) || [];

                          if (currentValue && typeof currentValue === 'object') {
                            selectedValue =
                              Object.values(currentValue).find((val) =>
                                constValues.includes(val)
                              ) || null;
                          } else if (
                            typeof currentValue === 'string' &&
                            constValues.includes(currentValue)
                          ) {
                            selectedValue = currentValue;
                          }

                          return (
                            <>
                              <Autocomplete
                                value={selectedValue}
                                onChange={(_, newValue) => {
                                  if (newValue && subField.constKey) {
                                    // Create the object with the const key
                                    const objectValue = { [subField.constKey]: newValue };

                                    // Find the selected option's sub-fields and set their default values
                                    const selectedSubFields = subField.subFields?.filter(
                                      (sf) => sf.parentValue === newValue
                                    );

                                    // Add default values for all sub-fields of the selected option
                                    if (selectedSubFields) {
                                      selectedSubFields.forEach((sf) => {
                                        const sfFieldName = sf.path[sf.path.length - 1];
                                        if (sf.default !== undefined) {
                                          objectValue[sfFieldName] = sf.default;
                                        }
                                      });
                                    }

                                    updateItem(index, fieldName, objectValue);
                                  } else {
                                    updateItem(index, fieldName, newValue);
                                  }
                                }}
                                options={constValues}
                                getOptionLabel={(option) => {
                                  const optionDetails = subField.constOptions?.find(
                                    (opt) => opt.value === option
                                  );
                                  return optionDetails?.title || option;
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder={`Select ${subField.title.toLowerCase()}`}
                                  />
                                )}
                              />
                              {/* Render sub-fields for oneOf selections */}
                              {selectedValue && subField.subFields && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                    {`${subField.constOptions?.find((opt) => opt.value === selectedValue)?.title || selectedValue} Configuration`}
                                  </Typography>
                                  {subField.subFields
                                    .filter((sf) => sf.parentValue === selectedValue)
                                    .map((sf) => {
                                      const sfFieldName = sf.path[sf.path.length - 1];
                                      // Get the nested value from the parent object
                                      const sfCurrentValue =
                                        currentValue && typeof currentValue === 'object'
                                          ? currentValue[sfFieldName]
                                          : undefined;

                                      return (
                                        <Box key={sf.id} sx={{ mb: 2 }}>
                                          <Box
                                            sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                                          >
                                            <InputLabel>
                                              {sf.title}
                                              {sf.required && '*'}
                                              {!sf.required && ' (optional)'}
                                            </InputLabel>
                                            {sf.description && (
                                              <Box sx={{ ml: 'auto' }}>
                                                <InfoTooltip title={sf.description} />
                                              </Box>
                                            )}
                                          </Box>
                                          {sf.type === 'string' && sf.enum ? (
                                            <Autocomplete
                                              value={sfCurrentValue || ''}
                                              onChange={(_, newValue) =>
                                                updateNestedField(
                                                  index,
                                                  fieldName,
                                                  sfFieldName,
                                                  newValue || ''
                                                )
                                              }
                                              options={sf.enum}
                                              renderInput={(params) => (
                                                <TextField
                                                  {...params}
                                                  placeholder={`Select ${sf.title.toLowerCase()}`}
                                                />
                                              )}
                                            />
                                          ) : sf.type === 'boolean' ? (
                                            <FormControlLabel
                                              control={
                                                <Switch
                                                  checked={sfCurrentValue || false}
                                                  onChange={(e) =>
                                                    updateNestedField(
                                                      index,
                                                      fieldName,
                                                      sfFieldName,
                                                      e.target.checked
                                                    )
                                                  }
                                                />
                                              }
                                              label={sfCurrentValue ? 'Enabled' : 'Disabled'}
                                              sx={{ ml: 0 }}
                                            />
                                          ) : sf.type === 'array' ? (
                                            <Autocomplete
                                              multiple
                                              freeSolo
                                              value={sfCurrentValue || []}
                                              onChange={(_, newValue) =>
                                                updateNestedField(
                                                  index,
                                                  fieldName,
                                                  sfFieldName,
                                                  newValue
                                                )
                                              }
                                              options={[]}
                                              renderInput={(params) => (
                                                <TextField
                                                  {...params}
                                                  placeholder={`Add ${sf.title.toLowerCase()}`}
                                                />
                                              )}
                                            />
                                          ) : (
                                            <TextField
                                              fullWidth
                                              value={sfCurrentValue ?? ''}
                                              onChange={(e) => {
                                                let val: any = e.target.value;
                                                if (sf.type === 'number' || sf.type === 'integer') {
                                                  const input = e.target as HTMLInputElement;
                                                  val = input.valueAsNumber;
                                                  if (Number.isNaN(val)) val = undefined;
                                                }
                                                updateNestedField(
                                                  index,
                                                  fieldName,
                                                  sfFieldName,
                                                  val
                                                );
                                              }}
                                              type={
                                                sf.type === 'number' || sf.type === 'integer'
                                                  ? 'number'
                                                  : 'text'
                                              }
                                              placeholder={`Enter ${sf.title.toLowerCase()}`}
                                            />
                                          )}
                                        </Box>
                                      );
                                    })}
                                </Box>
                              )}
                            </>
                          );
                        } else if (subField.type === 'string' && subField.enum) {
                          return (
                            <Autocomplete
                              value={currentValue || ''}
                              onChange={(_, newValue) =>
                                updateItem(index, fieldName, newValue || '')
                              }
                              options={subField.enum}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder={`Select ${subField.title.toLowerCase()}`}
                                />
                              )}
                            />
                          );
                        } else if (subField.type === 'boolean') {
                          return (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={currentValue || false}
                                  onChange={(e) => updateItem(index, fieldName, e.target.checked)}
                                />
                              }
                              label={currentValue ? 'Enabled' : 'Disabled'}
                              sx={{ ml: 0 }}
                            />
                          );
                        } else if (subField.type === 'array') {
                          return (
                            <Autocomplete
                              multiple
                              freeSolo
                              value={currentValue || []}
                              onChange={(_, newValue) => updateItem(index, fieldName, newValue)}
                              options={[]}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder={`Add ${subField.title.toLowerCase()}`}
                                />
                              )}
                            />
                          );
                        } else {
                          return (
                            <TextField
                              fullWidth
                              value={currentValue ?? ''}
                              onChange={(e) => {
                                let val: any = e.target.value;
                                if (subField.type === 'number' || subField.type === 'integer') {
                                  const input = e.target as HTMLInputElement;
                                  val = input.valueAsNumber;
                                  if (Number.isNaN(val)) val = undefined;
                                }
                                updateItem(index, fieldName, val);
                              }}
                              type={
                                subField.secret && !showPassword
                                  ? 'password'
                                  : subField.type === 'number' || subField.type === 'integer'
                                    ? 'number'
                                    : 'text'
                              }
                              multiline={subField.multiline}
                              rows={subField.multiline ? 4 : 1}
                              placeholder={`Enter ${subField.title.toLowerCase()}`}
                              InputProps={{
                                endAdornment: subField.secret && (
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() => setShowPassword(!showPassword)}
                                      edge="end"
                                    >
                                      {showPassword ? (
                                        <VisibilityOutlinedIcon />
                                      ) : (
                                        <VisibilityOffOutlinedIcon />
                                      )}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          );
                        }
                      };

                      return (
                        <Box key={`${fieldPath}[${index}].${fieldName}`} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <InputLabel>
                              {subField.title}
                              {subField.required && '*'}
                              {!subField.required && ' (optional)'}
                            </InputLabel>
                            {subField.description && (
                              <Box sx={{ ml: 'auto' }}>
                                <InfoTooltip title={subField.description} />
                              </Box>
                            )}
                          </Box>
                          {renderField()}
                        </Box>
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
                  if (Number.isNaN(val)) val = undefined;
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
