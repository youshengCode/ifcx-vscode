import { components } from '../../reference/ifc5-development/schema/out/ts/ifcx';
import { formatSchemaTooltip } from '../utils/schema-formatter';

// Type aliases for easier access to the generated types
type IfcxValueDescription = components['schemas']['IfcxValueDescription'];

describe('Schema Formatter', () => {
  it('should format basic String type', () => {
    const stringSchema: IfcxValueDescription = {
      dataType: 'String',
    };
    const result = formatSchemaTooltip('bsi::name', stringSchema);
    expect(result).toBeDefined();
  });

  it('should format Real with Quantity', () => {
    const realWithQuantitySchema: IfcxValueDescription = {
      dataType: 'Real',
      quantityKind: 'Volume',
    };
    const result = formatSchemaTooltip('bsi::ifc::v5a::prop::volume', realWithQuantitySchema);
    expect(result).toBeDefined();
  });

  it('should format Object with simple properties', () => {
    const objectSchema: IfcxValueDescription = {
      dataType: 'Object',
      objectRestrictions: {
        values: {
          code: { dataType: 'String' },
          uri: { dataType: 'String' },
        },
      },
    };
    const result = formatSchemaTooltip('bsi::ifc::v5a::class', objectSchema);
    expect(result).toBeDefined();
  });

  it('should format Object with nested objects', () => {
    const nestedObjectSchema: IfcxValueDescription = {
      dataType: 'Object',
      objectRestrictions: {
        values: {
          relatedElement: {
            dataType: 'Object',
            objectRestrictions: {
              values: {
                ref: { dataType: 'String' },
              },
            },
          },
          relatedSpace: {
            dataType: 'Object',
            objectRestrictions: {
              values: {
                ref: { dataType: 'String' },
              },
            },
          },
        },
      },
    };
    const result = formatSchemaTooltip('bsi::ifc::v5a::spaceboundary', nestedObjectSchema);
    expect(result).toBeDefined();
  });

  it('should format Array of Real', () => {
    const arraySchema: IfcxValueDescription = {
      dataType: 'Array',
      arrayRestrictions: {
        value: { dataType: 'Real' },
      },
    };
    const result = formatSchemaTooltip('usd::materials::inputs::diffuseColor', arraySchema);
    expect(result).toBeDefined();
  });

  it('should format Array of Array of Real', () => {
    const nestedArraySchema: IfcxValueDescription = {
      dataType: 'Array',
      arrayRestrictions: {
        value: {
          dataType: 'Array',
          arrayRestrictions: {
            value: { dataType: 'Real' },
          },
        },
      },
    };
    const result = formatSchemaTooltip('usd::xformop', nestedArraySchema);
    expect(result).toBeDefined();
  });

  it('should format Array with min/max', () => {
    const arrayWithLimitsSchema: IfcxValueDescription = {
      dataType: 'Array',
      arrayRestrictions: {
        min: 1,
        max: 30,
        value: { dataType: 'Integer' },
      },
    };
    const result = formatSchemaTooltip('usd::usdgeom::mesh', arrayWithLimitsSchema);
    expect(result).toBeDefined();
  });

  it('should format Enum', () => {
    const enumSchema: IfcxValueDescription = {
      dataType: 'Enum',
      enumRestrictions: {
        options: ['A', 'B', 'C'],
      },
    };
    const result = formatSchemaTooltip('bsi::predefinedtypes', enumSchema);
    expect(result).toBeDefined();
  });

  it('should format Relation', () => {
    const relationSchema: IfcxValueDescription = {
      dataType: 'Relation',
      relationRestrictions: {
        type: 'ifc:RelDefinesByProperties',
      },
    };
    const result = formatSchemaTooltip('bsi::relationexample', relationSchema);
    expect(result).toBeDefined();
  });

  it('should format Object with inheritance', () => {
    const inheritingObjectSchema: IfcxValueDescription = {
      dataType: 'Object',
      inherits: ['bsi::ifc::v5a::class'],
    };
    const result = formatSchemaTooltip('nlsfb::class', inheritingObjectSchema);
    expect(result).toBeDefined();
  });
});
