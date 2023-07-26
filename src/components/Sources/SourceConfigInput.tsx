import { Autocomplete, Box, IconButton, InputAdornment } from '@mui/material';
import React, { useEffect, useState } from 'react';
import MultiTagInput from '../MultiTagInput';
import { Controller } from 'react-hook-form';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import Input from '../UI/Input/Input';

export interface SourceConfigInputprops {
  errors: any;
  specs: Array<any>;
  registerFormFieldValue: (...args: any) => any;
  control: any;
  setFormValue: (...args: any) => any;
  unregisterFormField: (...args: any) => any;
  source?: any;
  lastRenderedSpecRef: any;
}

export type SourceSpec = {
  type: string;
  const?: unknown;
  field: string;
  title: string;
  default: unknown;
  airbyte_secret: boolean;
  required: boolean;
  enum?: Array<unknown>;
  parent?: string;
  specs?: Array<SourceSpec>;
  order: number;
  pattern?: string;
};

export const SourceConfigInput = ({
  errors,
  specs,
  registerFormFieldValue,
  control,
  setFormValue,
  unregisterFormField,
  source,
  lastRenderedSpecRef,
}: SourceConfigInputprops) => {
  const [connectorSpecs, setConnectorSpecs] = useState<Array<SourceSpec>>([]);

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
      connectorSpecs,
      unregisterFormField
    );

    setConnectorSpecs(tempSpecs);
    lastRenderedSpecRef.current = tempSpecs;
  };

  useEffect(() => {
    setConnectorSpecs(specs);
  }, [specs]);

  useEffect(() => {
    const tempShowPasswords: any = {};
    specs.forEach((element) => {
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
        .map((spec: SourceSpec, idx: number) => {
          const [parent, field] = spec.field.split('.');
          let hasError = false;
          let errorMessge = '';
          if (parent && field) {
            hasError = errors && errors.config && errors[parent][field];
            errorMessge =
              errors &&
              errors.config &&
              (errors[parent][field]?.message as string);
          }
          return spec.type === 'string' ? (
            spec.airbyte_secret ? (
              <React.Fragment key={idx}>
                <Input
                  error={hasError}
                  helperText={errorMessge}
                  sx={{ width: '100%' }}
                  label={spec.title}
                  register={registerFormFieldValue}
                  name={spec.field}
                  variant="outlined"
                  type={showPasswords[`${spec.field}`] ? 'text' : 'password'}
                  required={spec.required}
                  defaultValue={spec.default}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box>
                          <IconButton
                            onClick={() =>
                              handleClickShowPassword(`${spec.field}`)
                            }
                            edge="end"
                          >
                            {showPasswords[`${spec.field}`] ? (
                              <VisibilityOutlinedIcon />
                            ) : (
                              <VisibilityOffOutlinedIcon />
                            )}
                          </IconButton>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                ></Input>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            ) : (
              <React.Fragment key={idx}>
                <Input
                  error={hasError}
                  helperText={errorMessge}
                  sx={{ width: '100%' }}
                  label={spec.title}
                  variant="outlined"
                  register={registerFormFieldValue}
                  name={spec.field}
                  required={spec.required}
                  defaultValue={spec.default}
                  disabled={false}
                  inputProps={{ pattern: spec.pattern }}
                ></Input>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            )
          ) : spec.type === 'array' ? (
            <React.Fragment key={idx}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required }}
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
            <React.Fragment key={idx}>
              <Input
                error={hasError}
                helperText={errorMessge}
                disabled={false}
                sx={{ width: '100%' }}
                label={spec.title}
                variant="outlined"
                register={registerFormFieldValue}
                name={spec.field}
                required={spec.required}
                defaultValue={spec.default}
                type="number"
              ></Input>
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'object' ? (
            <React.Fragment key={idx}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required }}
                render={({ field }) => (
                  <Autocomplete
                    disabled={source ? true : false}
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
                        error={hasError}
                        helperText={errorMessge}
                        {...params}
                        variant="outlined"
                        label={spec.title}
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
