interface ConnectorSpecifications {
  type: string;
  title: string;
  $schema: string;
  required: Array<string>;
  properties: Object;
}

class ConnectorConfigInput {
  type: string;
  specsData: ConnectorSpecifications;
  constructor(type: string, data: ConnectorSpecifications) {
    this.type = type;
    this.specsData = { ...data };
  }

  setValidOrderToAllProperties() {
    // set order to all properties if not present
    let dataProperties: any = this.specsData['properties'];
    let maxOrder = -1;

    // specs get jumbled when we render them by order and the order starts with 0. So we increment by 1 to start ordering from 1
    for (const key of Object.keys(dataProperties)) {
      let value: any = dataProperties[key];
      dataProperties[key]['order'] = value?.order >= 0 ? value.order + 1 : -1;
      if (dataProperties[key]['order'] > maxOrder)
        maxOrder = dataProperties[key]['order'];
    }

    // Attach order to all specs
    for (const key in dataProperties) {
      if (dataProperties[key]['order'] === -1)
        dataProperties[key]['order'] = ++maxOrder;
    }

    this.specsData['properties'] = dataProperties;

    return this.specsData;
  }

  setOrderToChildProperties() {
    ConnectorConfigInput.traverseSpecsToSetOrder(this.specsData, null, 0);

    return this.specsData;
  }

  prepareSpecsToRender() {
    return ConnectorConfigInput.traverseSpecs(
      [],
      this.specsData,
      'config',
      [],
      []
    );
  }

  static traverseSpecsToSetOrder(
    data: any,
    parentOrder: number | null = null,
    ordCounter: number = 0
  ) {
    const dataProperties: any = data.properties;
    for (const key of Object.keys(dataProperties)) {
      let parent: any = dataProperties[key];
      if (parentOrder) parent['order'] = parentOrder + ordCounter;

      // check for which property we have the 'oneOf' key i.e. nested level
      // each nested property should have parentOrder + 0.1
      if (parent?.oneOf) {
        for (const oneOfObject of parent?.oneOf) {
          ConnectorConfigInput.traverseSpecsToSetOrder(
            oneOfObject,
            parent['order'],
            0.1
          );
        }
      }
    }
  }

  static traverseSpecs(
    result: any,
    data: any,
    parent = 'config',
    exclude: any[] = [],
    dropdownEnums: any[] = []
  ) {
    // Push the parent enum in the array
    if (exclude.length > 0) {
      if (exclude[0] in data?.properties) {
        dropdownEnums.push(data?.properties[exclude[0]]?.const);
      }
    }

    for (const [key, value] of Object.entries<any>(data?.properties || {})) {
      // The parent oneOf key has already been added to the array
      if (exclude.includes(key)) continue;

      const objParentKey = `${parent}.${key}`;

      if (value?.type === 'object') {
        let commonField: string[] = [];

        // Find common property among all array elements of 'oneOf' array
        if (value['oneOf'] && value['oneOf'].length > 1) {
          value['oneOf']?.forEach((ele: any) => {
            if (commonField.length > 0) {
              commonField = ele?.required.filter((value: any) =>
                commonField.includes(value)
              );
            } else {
              commonField = ele?.required;
            }
          });
        }

        const objResult = {
          field: `${objParentKey}.${commonField}`,
          type: value?.type,
          order: value?.order,
          title: value?.title,
          description: value?.description,
          parent:
            dropdownEnums.length > 0
              ? dropdownEnums[dropdownEnums.length - 1]
              : '',
          enum: [],
          specs: [],
        };

        result.push(objResult);

        value?.oneOf.forEach((eachEnum: any) => {
          ConnectorConfigInput.traverseSpecs(
            objResult.specs,
            eachEnum,
            objParentKey,
            commonField,
            objResult.enum
          );
        });

        continue;
      }

      result.push({
        ...value,
        field: objParentKey,
        parent:
          dropdownEnums.length > 0
            ? dropdownEnums[dropdownEnums.length - 1]
            : '',
        required: data?.required.includes(key),
      });
    }

    // Todo: need to find a better way to do this
    result.sort((a: any, b: any) => a.order - b.order);

    return result;
  }

  // Set values in form from connection configuration of a connector
  static prefillFormFields(
    connectionConfiguration: any,
    parent = 'config',
    setFormValueCallback: (...args: any) => any
  ) {
    for (const [key, value] of Object.entries(connectionConfiguration)) {
      const field: any = `${parent}.${key}`;

      const valIsObject =
        typeof value === 'object' && value !== null && !Array.isArray(value);

      if (valIsObject) {
        ConnectorConfigInput.prefillFormFields(
          value,
          field,
          setFormValueCallback
        );
      } else {
        setFormValueCallback(field, value);
      }
    }
  }
}

export default ConnectorConfigInput;
