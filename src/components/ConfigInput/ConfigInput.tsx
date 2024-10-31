import { Autocomplete, Box, IconButton, InputAdornment } from '@mui/material';
import React, { useEffect, useState } from 'react';
import MultiTagInput from '../MultiTagInput';
import { Controller } from 'react-hook-form';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import Input from '../UI/Input/Input';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';

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
};

export const ConfigInput = ({ specs, control, setFormValue, entity }: ConfigInputprops) => {
  const [connectorSpecs, setConnectorSpecs] = useState<Array<EntitySpec>>([]);

  const [showPasswords, setShowPasswords] = useState<any>({});

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
          console.log(spec, 'PEC');
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
            ) : spec?.enum && spec?.enum.length > 0 ? (
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
          ) : (
            ''
          );
        })}
    </>
  );
};
