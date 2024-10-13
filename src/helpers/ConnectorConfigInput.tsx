interface ConnectorSpecificationsObject {
  type: string;
  title: string;
  $schema: string;
  required: Array<string>;
  properties: object;
}

export type ConnectorSpec = {
  type: string;
  const?: unknown;
  field: string;
  title: string;
  default: unknown;
  airbyte_secret: boolean;
  required: boolean;
  enum?: Array<unknown>;
  parent?: string;
  specs?: Array<ConnectorSpec>;
  order: number;
  pattern?: string;
};

class ConnectorConfigInput {
  type: string;
  specsData: ConnectorSpecificationsObject;
  specsToRender: Array<ConnectorSpec>;

  constructor(type: string, data: ConnectorSpecificationsObject) {
    this.type = type;
    this.specsData = { ...data };
    this.specsToRender = [];
  }

  setValidOrderToAllProperties() {
    // set order to all properties if not present
    const dataProperties: any = this.specsData['properties'];
    let maxOrder = -1;

    if (dataProperties) {
      // specs get jumbled when we render them by order and the order starts with 0. So we increment by 1 to start ordering from 1
      for (const key of Object.keys(dataProperties)) {
        const value: any = dataProperties[key];
        dataProperties[key]['order'] = value?.order >= 0 ? value.order + 1 : -1;
        if (dataProperties[key]['order'] > maxOrder) maxOrder = dataProperties[key]['order'];
      }
    }

    // the specs don't have an order attributes
    if (maxOrder === -1) maxOrder = 0;

    // Attach order to all specs
    for (const key in dataProperties) {
      if (dataProperties[key]['order'] === -1) dataProperties[key]['order'] = ++maxOrder;
    }

    return this.specsData;
  }

  setOrderToChildProperties() {
    ConnectorConfigInput.traverseSpecsToSetOrder(this.specsData, null, 0);

    return this.specsData;
  }

  prepareSpecsToRender() {
    this.specsToRender = ConnectorConfigInput.traverseSpecs([], this.specsData, 'config', [], []);
    return this.specsToRender;
  }

  updateSpecsToRender(connectionConfiguration: any) {
    const childSpecs: Array<ConnectorSpec> = ConnectorConfigInput.appendChildSpecsForEdit(
      this.specsToRender,
      connectionConfiguration,
      'config',
      []
    );

    return this.specsToRender.concat(childSpecs);
  }

  static traverseSpecsToSetOrder(data: any, parentOrder: number | null = null, ordCounter = 0) {
    const dataProperties: any = data.properties;

    if (dataProperties) {
      for (const key of Object.keys(dataProperties)) {
        const parent: any = dataProperties[key];
        if (parentOrder) parent['order'] = parentOrder + ordCounter;

        // check for which property we have the 'oneOf' key i.e. nested level
        // each nested property should have parentOrder + 0.1
        if (parent && parent?.oneOf) {
          for (const oneOfObject of parent.oneOf) {
            ConnectorConfigInput.traverseSpecsToSetOrder(oneOfObject, parent['order'], 0.1);
          }
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
        dropdownEnums.push(
          data?.properties[exclude[0]]?.const || data?.properties[exclude[0]]?.enum[0]
        );
      }
    }

    // for top level parent only. Applicable for parents that have no property value like e2e testing
    if (data?.type === 'object' && data['oneOf']) {
      let commonField: string[] = [];

      if (data['oneOf'].length > 1) {
        data['oneOf']?.forEach((ele: any) => {
          if (commonField.length > 0) {
            commonField = Object.keys(ele?.properties || {}).filter((value: any) =>
              commonField.includes(value)
            );
          } else {
            commonField = Object.keys(ele?.properties || {});
          }
        });
      }

      const objResult = {
        field: `${parent}.${commonField}`,
        type: data?.type,
        order: data?.order,
        title: data?.title,
        description: data?.description,
        parent: dropdownEnums.length > 0 ? dropdownEnums[dropdownEnums.length - 1] : '',
        enum: [],
        specs: [],
      };

      result.push(objResult);

      data?.oneOf?.forEach((eachEnum: any) => {
        ConnectorConfigInput.traverseSpecs(
          objResult.specs,
          eachEnum,
          parent,
          commonField,
          objResult.enum
        );
      });
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
              commonField = Object.keys(ele?.properties).filter((value: any) =>
                commonField.includes(value)
              );
            } else {
              commonField = Object.keys(ele?.properties);
            }
          });
        }

        // an object type can either have oneOf or properties
        if (value.properties) {
          const specs = ConnectorConfigInput.traverseSpecs([], value, objParentKey, [], []);
          result.push(...specs);
        } else if (value['oneOf']) {
          const objResult = {
            field: `${objParentKey}.${commonField}`,
            type: value?.type,
            order: value?.order,
            title: value?.title,
            description: value?.description,
            parent: dropdownEnums.length > 0 ? dropdownEnums[dropdownEnums.length - 1] : '',
            enum: [],
            specs: [],
          };
          result.push(objResult);
          value?.oneOf?.forEach((eachEnum: any) => {
            ConnectorConfigInput.traverseSpecs(
              objResult.specs,
              eachEnum,
              objParentKey,
              commonField,
              objResult.enum
            );
          });
        }

        continue;
      }

      result.push({
        ...value,
        field: objParentKey,
        parent: dropdownEnums.length > 0 ? dropdownEnums[dropdownEnums.length - 1] : '',
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

      const valIsObject = typeof value === 'object' && value !== null && !Array.isArray(value);

      if (valIsObject) {
        ConnectorConfigInput.prefillFormFields(value, field, setFormValueCallback);
      } else {
        setFormValueCallback(field, value);
      }
    }
  }

  // update specs to render by appending child specs that have been filled/selected/edited
  static appendChildSpecsForEdit(
    specs: Array<ConnectorSpec>,
    connectionConfiguration: any,
    parent = 'config',
    childSpecs: Array<ConnectorSpec> = []
  ) {
    for (const [key, value] of Object.entries(connectionConfiguration)) {
      const field: any = `${parent}.${key}`;

      const childSpec: ConnectorSpec | undefined = specs.find(
        (sp: ConnectorSpec) => sp.field === field
      );

      // if the spec if not present in specs, then the connection configuration must be an object type
      // so we need to traverse inside it
      const valIsObject = typeof value === 'object' && value !== null && !Array.isArray(value);

      if (!childSpec && valIsObject) {
        if (Object.keys(value).length > 1) {
          ConnectorConfigInput.appendChildSpecsForEdit(specs, value, field, childSpecs);
        }
      } else if (!childSpec) {
        const regexp = new RegExp(`^${field.split('.', 2).join('.')}`);

        const specsToFindFrom: Array<ConnectorSpec> | undefined = specs.find((sp: ConnectorSpec) =>
          regexp.test(sp.field)
        )?.specs;

        if (specsToFindFrom) {
          const checkSpec: ConnectorSpec | undefined = specsToFindFrom.find(
            (sp: ConnectorSpec) => sp.field === field
          );

          if (checkSpec) childSpecs.push(checkSpec);
        }
      }
    }
    return childSpecs;
  }

  // handle the on change of object type field in the connectors
  static fetchUpdatedSpecsOnObjectFieldChange(
    dropDownVal: string,
    field: string,
    currenRenderedSpecs: Array<ConnectorSpec>
  ) {
    // Fetch the current selected spec of type object based on selection
    const selectedSpec: ConnectorSpec | undefined = currenRenderedSpecs.find(
      (ele: ConnectorSpec) => ele.field === field
    );

    // Filter all specs that are under selectedSpec and have parent as selectedSpec
    // Check if any child specs has type object
    const filteredChildSpecs: Array<ConnectorSpec> = [];
    if (selectedSpec && selectedSpec.specs) {
      selectedSpec.specs.forEach((ele: ConnectorSpec) => {
        if (ele.parent === dropDownVal) {
          // Check if the child has another level or not
          if (ele.specs && ele.enum && ele.enum.length === 0) {
            ele.specs.forEach((childEle: ConnectorSpec) => {
              filteredChildSpecs.push({
                ...childEle,
                parent: childEle?.parent ? childEle.parent : ele.parent,
                order: ele.order,
              });
            });
          } else {
            filteredChildSpecs.push(ele);
          }
        }
      });
    }

    // Find the specs that will have parent in the following enum array
    const enumsToRemove =
      (selectedSpec &&
        selectedSpec.enum &&
        selectedSpec.enum.filter((ele) => ele !== dropDownVal)) ||
      [];

    const tempSpecs = currenRenderedSpecs
      .filter((sp: ConnectorSpec) => !sp.parent || !enumsToRemove.includes(sp.parent))
      .concat(filteredChildSpecs);

    return tempSpecs;
  }
}

export default ConnectorConfigInput;
