import {
  Autocomplete,
  Box,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import MultiTagInput from '../MultiTagInput';
import { Controller } from 'react-hook-form';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import Input from '../UI/Input/Input';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';

export type DestinationSpec = {
  type: string;
  const?: unknown;
  field: string;
  title: string;
  default: unknown;
  airbyte_secret: boolean;
  required: boolean;
  enum?: Array<unknown>;
  parent?: string;
  specs?: Array<DestinationSpec>;
  order: number;
};

export interface DestinationConfigInputprops {
  errors: any;
  specs: Array<DestinationSpec>;
  registerFormFieldValue: (...args: any) => any;
  control: any;
  setFormValue: (...args: any) => any;
  unregisterFormField: (...args: any) => any;
  destination?: any;
}

export const DestinationConfigInput = ({
  errors,
  specs,
  registerFormFieldValue,
  control,
  setFormValue,
  unregisterFormField,
  destination,
}: DestinationConfigInputprops) => {
  const [connectorSpecs, setConnectorSpecs] = useState<Array<DestinationSpec>>(
    []
  );
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
      // registerFormFieldValue
    );

    setConnectorSpecs(tempSpecs);
  };

  useEffect(() => {
    setConnectorSpecs(specs);
  }, [specs]);

  useEffect(() => {
    const tempShowPasswords: any = {};
    specs.forEach((element) => {
      if (element.airbyte_secret) {
        tempShowPasswords[element.field] = false;
      }
    });
    setShowPasswords(tempShowPasswords);
  }, [specs]);

  return (
    <>
      {connectorSpecs
        ?.sort((input1, input2) => input1.order - input2.order)
        ?.map((spec: DestinationSpec, idx: number) => {
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
            spec.const ? ( // type == string and a const selected value
              <React.Fragment key={idx}>
                <Input
                  error={hasError}
                  helperText={errorMessge}
                  sx={{ width: '100%' }}
                  label={spec.const as any}
                  variant="outlined"
                  value={spec.const}
                  register={registerFormFieldValue}
                  name={spec.field}
                  required={spec.required}
                  disabled={destination && !spec.airbyte_secret ? true : false}
                ></Input>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            ) : spec.airbyte_secret ? ( // type == string and a password/secret field
              <React.Fragment key={idx}>
                <Input
                  error={hasError}
                  helperText={errorMessge}
                  sx={{ width: '100%' }}
                  label={spec.title}
                  variant="outlined"
                  type={showPasswords[spec.field] ? 'text' : 'password'}
                  register={registerFormFieldValue}
                  name={spec.field}
                  required={spec.required}
                  defaultValue={spec.default}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box>
                          <IconButton
                            onClick={() => handleClickShowPassword(spec.field)}
                            edge="end"
                          >
                            {showPasswords[spec.field] ? (
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
            ) : spec.enum && spec.enum.length > 0 ? ( // type == string and a dropdown select
              <React.Fragment key={idx}>
                <Controller
                  name={spec.field}
                  control={control}
                  rules={{ required: spec.required }}
                  render={({ field }) => (
                    <Autocomplete
                      disabled={
                        destination && !spec.airbyte_secret ? true : false
                      }
                      id={spec.field}
                      options={spec.enum as unknown[]}
                      onChange={(e, data: any) => {
                        field.onChange(data);
                      }}
                      renderInput={(params) => (
                        <Input
                          name={spec.field}
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
              // type == string , default
              <React.Fragment key={idx}>
                <Input
                  error={hasError}
                  helperText={errorMessge}
                  disabled={destination ? true : false}
                  sx={{ width: '100%' }}
                  label={spec.title}
                  variant="outlined"
                  register={registerFormFieldValue}
                  name={spec.field}
                  required={spec.required}
                  defaultValue={spec.default}
                ></Input>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            )
          ) : spec.type === 'boolean' ? (
            <React.Fragment key={idx}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required }}
                defaultValue={spec.default}
                render={({ field: { value } }) => (
                  <Stack direction={'row'} alignItems="center" gap={'10%'}>
                    <Box>{spec.title}</Box>
                    <Switch
                      disabled={
                        destination && !spec.airbyte_secret ? true : false
                      }
                      value={value}
                      onChange={(event, value) => {
                        setFormValue(spec.field, value);
                      }}
                    />
                  </Stack>
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'array' ? (
            <React.Fragment key={idx}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required }}
                render={({ field: { value } }) => (
                  <MultiTagInput
                    disabled={
                      destination && !spec.airbyte_secret ? true : false
                    }
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
                disabled={destination && !spec.airbyte_secret ? true : false}
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
                    disabled={
                      destination && !spec.airbyte_secret ? true : false
                    }
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
