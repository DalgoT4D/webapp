import {
  Autocomplete,
  Box,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  Switch,
  Button,
  Typography,
  Card,
  CardContent,
  Divider,
  TextField,
  MenuItem,
  Select,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import MultiTagInput from '../MultiTagInput';
import { Controller } from 'react-hook-form';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import Input from '../UI/Input/Input';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export interface ConfigInputprops {
  specs: Array<any>;
  control: any;
  setFormValue: (...args: any) => any;
  entity?: any;
}

export type EntitySpec = {
  type: string;
  const?: unknown;
  field: string;
  title: string;
  default: unknown;
  airbyte_secret: boolean;
  required: boolean;
  enum?: Array<unknown>;
  parent?: string;
  specs?: Array<EntitySpec>;
  order: number;
  pattern?: string;
  multiline?: boolean;
  isArrayOfObjects?: boolean;
  objectSchema?: any;
  description?: string;
  isS3StreamConfig?: boolean;
  formatOptions?: Array<{
    label: string;
    value: string;
    schema: any;
  }>;
  staticProperties?: Array<{
    key: string;
    title?: string;
    type?: string;
    description?: string;
    default?: any;
    required?: boolean;
    [key: string]: any;
  }>;
};

export const ConfigInput = ({ specs, control, setFormValue, entity }: ConfigInputprops) => {
  const [connectorSpecs, setConnectorSpecs] = useState<Array<EntitySpec>>([]);
  const [showPasswords, setShowPasswords] = useState<any>({});
  const [arrayItemCounts, setArrayItemCounts] = useState<Record<string, number>>({});
  const [streamFormatSelections, setStreamFormatSelections] = useState<Record<string, string>>({});

  const handleClickShowPassword = (field: string) => {
    const tempShowPasswords: any = { ...showPasswords };
    tempShowPasswords[field] = !showPasswords[field];
    setShowPasswords(tempShowPasswords);
  };

  const handleObjectFieldOnChange = (
    dropDownVal: string,
    field: string,
    fieldOnChangeFunc: any
  ) => {
    fieldOnChangeFunc.onChange(dropDownVal);

    const tempSpecs = ConnectorConfigInput.fetchUpdatedSpecsOnObjectFieldChange(
      dropDownVal,
      field,
      connectorSpecs
    );

    setConnectorSpecs(tempSpecs);
  };

  // Function to handle adding a new item to an array of objects
  const handleAddArrayItem = (fieldName: string) => {
    const currentCount = arrayItemCounts[fieldName] || 0;
    const newCount = currentCount + 1;

    setArrayItemCounts({
      ...arrayItemCounts,
      [fieldName]: newCount,
    });

    // Initialize the new array item with default values
    const arrayItemSchema = connectorSpecs.find((spec) => spec.field === fieldName)?.objectSchema;
    if (arrayItemSchema?.properties) {
      Object.entries(arrayItemSchema.properties).forEach(([propKey, propValue]: [string, any]) => {
        const itemField = `${fieldName}.${currentCount}.${propKey}`;
        setFormValue(itemField, propValue.default || null);
      });
    }
  };

  // Function to handle removing an item from an array of objects
  const handleRemoveArrayItem = (fieldName: string, index: number) => {
    const currentCount = arrayItemCounts[fieldName] || 0;
    if (currentCount > 0) {
      setArrayItemCounts({
        ...arrayItemCounts,
        [fieldName]: currentCount - 1,
      });

      // Remove form values for this item
      // This is a simplified approach, in a real implementation you'd need to
      // shift all subsequent items down to maintain the array properly
      const arrayItemSchema = connectorSpecs.find((spec) => spec.field === fieldName)?.objectSchema;
      if (arrayItemSchema?.properties) {
        Object.keys(arrayItemSchema.properties).forEach((propKey) => {
          const itemField = `${fieldName}.${index}.${propKey}`;
          setFormValue(itemField, undefined);
        });
      }
    }
  };

  // Handle format selection for S3 streams
  const handleFormatChange = (fieldName: string, index: number, formatValue: string) => {
    const itemField = `${fieldName}.${index}.format.filetype`;
    setFormValue(itemField, formatValue);

    const streamKey = `${fieldName}.${index}`;
    setStreamFormatSelections({
      ...streamFormatSelections,
      [streamKey]: formatValue,
    });
  };

  // Function to render a single stream item for S3
  const renderS3StreamItem = (fieldName: string, spec: EntitySpec, index: number) => {
    const streamKey = `${fieldName}.${index}`;
    const selectedFormat = streamFormatSelections[streamKey] || '';

    // Find the format schema for the selected format
    const formatSchema = spec.formatOptions?.find((opt) => opt.value === selectedFormat)?.schema;

    return (
      <Card key={`${fieldName}-item-${index}`} sx={{ mb: 2, mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1">Stream {index + 1}</Typography>
            <IconButton
              color="error"
              onClick={() => handleRemoveArrayItem(fieldName, index)}
              aria-label="Remove stream"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {/* Render static properties first */}
          {spec.staticProperties?.map((propSpec) => {
            const itemField = `${fieldName}.${index}.${propSpec.key}`;
            const isRequired =
              Array.isArray(spec.objectSchema?.required) &&
              spec.objectSchema.required.includes(propSpec.key);

            if (propSpec.type === 'string') {
              return (
                <Box key={itemField} sx={{ mb: 2 }}>
                  <Controller
                    name={itemField}
                    control={control}
                    rules={{ required: isRequired && 'Required' }}
                    defaultValue={propSpec.default || null}
                    render={({ field: { ref, ...rest }, fieldState }) => (
                      <Input
                        {...rest}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        sx={{ width: '100%' }}
                        label={`${propSpec.title || propSpec.key}${isRequired ? '*' : ''}`}
                        variant="outlined"
                      />
                    )}
                  />
                </Box>
              );
            } else if (propSpec.type === 'array' && propSpec.key === 'globs') {
              return (
                <Box key={itemField} sx={{ mb: 2 }}>
                  <Controller
                    name={itemField}
                    control={control}
                    defaultValue={propSpec.default || []}
                    rules={{ required: isRequired && 'Required' }}
                    render={({ field: { value } }) => (
                      <MultiTagInput
                        disabled={false}
                        field={itemField}
                        label={propSpec.title || propSpec.key}
                        fieldValueArr={value}
                        setFormValue={setFormValue}
                      />
                    )}
                  />
                </Box>
              );
            }

            // Add handling for other types as needed
            return null;
          })}

          {/* Format Selection */}
          <Box sx={{ mb: 2 }}>
            <InputLabel>File Format*</InputLabel>
            <Select
              value={selectedFormat}
              onChange={(e) => handleFormatChange(fieldName, index, e.target.value)}
              fullWidth
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select a file format
              </MenuItem>
              {spec.formatOptions?.map((format) => (
                <MenuItem key={format.value} value={format.value}>
                  {format.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Render format-specific fields */}
          {selectedFormat && formatSchema && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Format Configuration
              </Typography>

              {Object.entries(formatSchema.properties || {}).map(
                ([propKey, propValue]: [string, any]) => {
                  // Skip the filetype field as we're already handling it above
                  if (propKey === 'filetype') return null;

                  const formatField = `${fieldName}.${index}.format.${propKey}`;
                  const isFormatRequired =
                    Array.isArray(formatSchema.required) && formatSchema.required.includes(propKey);

                  if (propValue.type === 'string') {
                    return (
                      <Box key={formatField} sx={{ mb: 2 }}>
                        <Controller
                          name={formatField}
                          control={control}
                          defaultValue={propValue.default || null}
                          rules={{ required: isFormatRequired && 'Required' }}
                          render={({ field: { ref, ...rest }, fieldState }) => (
                            <Input
                              {...rest}
                              error={!!fieldState.error}
                              helperText={fieldState.error?.message}
                              sx={{ width: '100%' }}
                              label={`${propValue.title || propKey}${isFormatRequired ? '*' : ''}`}
                              variant="outlined"
                            />
                          )}
                        />
                      </Box>
                    );
                  } else if (propValue.type === 'boolean') {
                    return (
                      <Box key={formatField} sx={{ mb: 2 }}>
                        <Controller
                          name={formatField}
                          control={control}
                          defaultValue={propValue.default || false}
                          render={({ field: { onChange, value } }) => (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={Boolean(value)}
                                  onChange={(e) => onChange(e.target.checked)}
                                />
                              }
                              label={propValue.title || propKey}
                            />
                          )}
                        />
                      </Box>
                    );
                  } else if (propValue.type === 'integer') {
                    return (
                      <Box key={formatField} sx={{ mb: 2 }}>
                        <Controller
                          name={formatField}
                          control={control}
                          defaultValue={propValue.default || 0}
                          rules={{ required: isFormatRequired && 'Required' }}
                          render={({ field: { ref, onChange, ...rest }, fieldState }) => (
                            <Input
                              {...rest}
                              onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                              error={!!fieldState.error}
                              helperText={fieldState.error?.message}
                              sx={{ width: '100%' }}
                              label={`${propValue.title || propKey}${isFormatRequired ? '*' : ''}`}
                              variant="outlined"
                              type="number"
                            />
                          )}
                        />
                      </Box>
                    );
                  } else if (propValue.type === 'array') {
                    return (
                      <Box key={formatField} sx={{ mb: 2 }}>
                        <Controller
                          name={formatField}
                          control={control}
                          defaultValue={propValue.default || []}
                          rules={{ required: isFormatRequired && 'Required' }}
                          render={({ field: { value } }) => (
                            <MultiTagInput
                              disabled={false}
                              field={formatField}
                              label={propValue.title || propKey}
                              fieldValueArr={value}
                              setFormValue={setFormValue}
                            />
                          )}
                        />
                      </Box>
                    );
                  }

                  // Add handling for other types as needed
                  return null;
                }
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Function to render a standard array item
  const renderArrayItem = (fieldName: string, itemSchema: any, index: number) => {
    return (
      <Card key={`${fieldName}-item-${index}`} sx={{ mb: 2, mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1">Item {index + 1}</Typography>
            <IconButton
              color="error"
              onClick={() => handleRemoveArrayItem(fieldName, index)}
              aria-label="Remove item"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {itemSchema?.properties &&
            Object.entries(itemSchema.properties).map(([propKey, propValue]: [string, any]) => {
              const itemField = `${fieldName}.${index}.${propKey}`;
              const isRequired =
                Array.isArray(itemSchema.required) && itemSchema.required.includes(propKey);

              return (
                <Box key={itemField} sx={{ mb: 2 }}>
                  <Controller
                    name={itemField}
                    control={control}
                    rules={{ required: isRequired && 'Required' }}
                    defaultValue={propValue.default || null}
                    render={({ field: { ref, ...rest }, fieldState }) => (
                      <Input
                        {...rest}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        sx={{ width: '100%' }}
                        label={`${propValue.title || propKey}${isRequired ? '*' : ''}`}
                        variant="outlined"
                      />
                    )}
                  />
                </Box>
              );
            })}
        </CardContent>
      </Card>
    );
  };

  // Function to render an array of objects
  const renderArrayOfObjects = (spec: EntitySpec) => {
    const count = arrayItemCounts[spec.field] || 0;
    const items = Array.from({ length: count }, (_, i) => i);

    return (
      <React.Fragment key={spec.field}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">{spec.title}</Typography>
          <Typography variant="body2" color="textSecondary">
            {spec.description}
          </Typography>

          {spec.isS3StreamConfig
            ? items.map((index) => renderS3StreamItem(spec.field, spec, index))
            : items.map((index) => renderArrayItem(spec.field, spec.objectSchema, index))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleAddArrayItem(spec.field)}
            sx={{ mt: 1 }}
          >
            Add {spec.title?.toLowerCase() || 'item'}
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />
      </React.Fragment>
    );
  };

  useEffect(() => {
    setConnectorSpecs(specs);
  }, [specs]);

  useEffect(() => {
    const tempShowPasswords: any = {};
    specs?.forEach((element) => {
      if (element?.airbyte_secret) {
        tempShowPasswords[element.field] = false;
      }
    });
    setShowPasswords(tempShowPasswords);
  }, [specs]);

  return (
    <>
      {connectorSpecs
        ?.sort((input1, input2) => input1.order - input2.order)
        .map((spec: EntitySpec) => {
          // Handle array of objects type (like 'streams' in S3)
          if (spec.isArrayOfObjects) {
            return renderArrayOfObjects(spec);
          }

          return spec?.type === 'string' ? (
            spec?.airbyte_secret ? (
              <React.Fragment key={spec.field}>
                <Controller
                  name={spec.field}
                  control={control}
                  rules={{ required: spec.required && 'Required' }}
                  render={({ field: { ref, ...rest }, fieldState }) => (
                    <Input
                      {...rest}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      sx={{ width: '100%' }}
                      label={`${spec.title}${spec.required ? '*' : ''}`}
                      variant="outlined"
                      type={showPasswords[`${spec.field}`] ? 'text' : 'password'}
                      multiline={spec?.multiline}
                      rows={4}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {!entity ? (
                              <Box>
                                <IconButton
                                  onClick={() => handleClickShowPassword(`${spec.field}`)}
                                  edge="end"
                                >
                                  {showPasswords[`${spec.field}`] ? (
                                    <VisibilityOutlinedIcon />
                                  ) : (
                                    <VisibilityOffOutlinedIcon />
                                  )}
                                </IconButton>
                              </Box>
                            ) : (
                              <></>
                            )}
                          </InputAdornment>
                        ),
                      }}
                    ></Input>
                  )}
                />
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            ) : spec?.enum &&
              spec?.enum.length > 0 &&
              (spec?.specs == null || spec?.specs === undefined) ? (
              <>
                <React.Fragment key={spec.field}>
                  <Controller
                    name={spec.field}
                    control={control}
                    rules={{ required: spec.required && 'Required' }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        disabled={false}
                        data-testid="autocomplete"
                        id={spec.field}
                        value={field.value}
                        options={spec.enum as any}
                        onChange={(e, data: any) => {
                          handleObjectFieldOnChange(data, spec.field, field);
                        }}
                        renderInput={(params) => (
                          <Input
                            name={spec.field}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            {...params}
                            variant="outlined"
                            label={`${spec.title}${spec.required ? '*' : ''}`}
                          />
                        )}
                      />
                    )}
                  />
                  <Box sx={{ m: 2 }} />
                </React.Fragment>
              </>
            ) : (
              <React.Fragment key={spec.field}>
                <Controller
                  name={spec.field}
                  control={control}
                  rules={{ required: spec.required && 'Required' }}
                  render={({ field: { ref, ...rest }, fieldState }) => (
                    <Input
                      {...rest}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      sx={{ width: '100%' }}
                      label={`${spec.title}${spec.required ? '*' : ''}`}
                      variant="outlined"
                      disabled={false}
                      multiline={spec?.multiline}
                      rows={4}
                      inputProps={{ pattern: spec.pattern }}
                    ></Input>
                  )}
                />
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            )
          ) : spec.type === 'array' ? (
            <React.Fragment key={spec.field}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required && 'Required' }}
                render={({ field: { value } }) => (
                  <MultiTagInput
                    disabled={false}
                    field={spec.field}
                    label={spec.title}
                    fieldValueArr={value}
                    setFormValue={setFormValue}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'integer' ? (
            <React.Fragment key={spec.field}>
              <Controller
                name={spec.field}
                control={control}
                rules={{
                  required: spec.required && 'Required',
                }}
                render={({ field: { ref, onChange, ...rest }, fieldState }) => (
                  <Input
                    {...rest}
                    onChange={(event) => {
                      onChange(parseInt(event.target.value));
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={false}
                    sx={{ width: '100%' }}
                    label={`${spec.title}${spec.required ? '*' : ''}`}
                    variant="outlined"
                    type="number"
                  ></Input>
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'object' ? (
            <React.Fragment key={spec.field}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required && 'Required' }}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    disabled={false}
                    data-testid="autocomplete"
                    id={spec.field}
                    value={field.value}
                    options={spec.enum as any}
                    onChange={(e, data: any) => {
                      handleObjectFieldOnChange(data, spec.field, field);
                    }}
                    renderInput={(params) => (
                      <Input
                        name={spec.field}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        {...params}
                        variant="outlined"
                        label={`${spec.title}${spec.required ? '*' : ''}`}
                      />
                    )}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'boolean' ? (
            <React.Fragment key={spec.field}>
              <Controller
                name={spec.field}
                control={control}
                render={({ field: { ref, onChange, value, ...rest }, fieldState }) => (
                  <>
                    <FormControlLabel
                      sx={{ margin: '0' }}
                      labelPlacement="end"
                      label={
                        <InputLabel
                          sx={{
                            marginBottom: '5px',
                            mt: '5px',
                            maxWidth: '100%',
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflow: 'hidden',
                          }}
                        >{`${spec.title}${spec.required ? '*' : ''}`}</InputLabel>
                      }
                      control={
                        <Switch
                          {...rest}
                          checked={value}
                          onChange={(event) => {
                            onChange(event.target.checked);
                          }}
                        />
                      }
                    />
                  </>
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : (
            ''
          );
        })}
    </>
  );
};
