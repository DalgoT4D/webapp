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
    ConnectorConfigInput.traverseSpecsToSetOrder(this.specsData, { count: 0 });

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

  static traverseSpecsToSetOrder(
    data: { properties?: ConnectorProperties },
    globalCounter: GlobalCounter = { count: 0 }
  ) {
    const dataProperties = data.properties;

    if (dataProperties) {
      const sortedKeys = Object.keys(dataProperties).sort(
        (a, b) => (dataProperties[a].order || 0) - (dataProperties[b].order || 0)
      );

      for (const key of sortedKeys) {
        const parent = dataProperties[key];

        globalCounter.count++;
        parent.order = globalCounter.count;

        if (parent.oneOf) {
          for (const oneOfObject of parent.oneOf) {
            ConnectorConfigInput.traverseSpecsToSetOrder(oneOfObject, globalCounter);
          }
        }

        if (parent.properties) {
          ConnectorConfigInput.traverseSpecsToSetOrder(parent, globalCounter);
        }
      }
    }
  }

  static traverseSpecs(
    result: Array<ConnectorSpec>,
    data: {
      properties?: ConnectorProperties;
      type?: string;
      oneOf?: Array<{ properties?: ConnectorProperties }>;
      required?: Array<string>;
    },
    parent = 'config',
    exclude: Array<string> = [],
    dropdownEnums: Array<unknown> = []
  ): Array<ConnectorSpec> {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid data provided to traverseSpecs:', data);
      return result;
    }

    if (exclude.length > 0 && data.properties) {
      const excludeKey = exclude[0];
      if (excludeKey in data.properties) {
        const property = data.properties[excludeKey];
        dropdownEnums.push(property?.const || property?.enum?.[0] || null);
      }
    }

    if (data.type === 'object' && Array.isArray(data.oneOf)) {
      let commonField: string[] = [];

      if (data.oneOf.length > 1) {
        data.oneOf.forEach((ele) => {
          if (commonField.length > 0) {
            commonField = Object.keys(ele?.properties || {}).filter((value) =>
              commonField.includes(value)
            );
          } else {
            commonField = Object.keys(ele?.properties || {});
          }
        });
      }

      const objResult: ConnectorSpec = {
        field: `${parent}.${commonField}`,
        type: data.type,
        order: data.order || 0,
        title: data.title || '',
        description: data.description || '',
        parent: dropdownEnums.length > 0 ? dropdownEnums[dropdownEnums.length - 1] : '',
        enum: [],
        specs: [],
      };

      result.push(objResult);

      data.oneOf.forEach((eachEnum) => {
        ConnectorConfigInput.traverseSpecs(
          objResult.specs,
          eachEnum,
          parent,
          commonField,
          objResult.enum
        );
      });
    }

    for (const [key, value] of Object.entries(data.properties || {})) {
      if (exclude.includes(key)) continue;

      const objParentKey = `${parent}.${key}`;

      if (value.type === 'object') {
        let commonField: string[] = [];

        if (Array.isArray(value.oneOf) && value.oneOf.length > 1) {
          value.oneOf.forEach((ele) => {
            if (commonField.length > 0) {
              commonField = Object.keys(ele?.properties || {}).filter((key) =>
                commonField.includes(key)
              );
            } else {
              commonField = Object.keys(ele?.properties || {});
            }
          });
        }

        if (value.properties) {
          const specs = ConnectorConfigInput.traverseSpecs([], value, objParentKey, [], []);
          result.push(...specs);
        } else if (value.oneOf) {
          const objResult: ConnectorSpec = {
            field: `${objParentKey}.${commonField}`,
            type: value.type,
            order: value.order || 0,
            title: value.title || '',
            description: value.description || '',
            parent: dropdownEnums.length > 0 ? dropdownEnums[dropdownEnums.length - 1] : '',
            enum: [],
            specs: [],
          };
          result.push(objResult);
          value.oneOf.forEach((eachEnum) => {
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
        required: Array.isArray(data.required) && data.required.includes(key),
      });
    }

    result.sort((a, b) => (a.order || 0) - (b.order || 0));

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
