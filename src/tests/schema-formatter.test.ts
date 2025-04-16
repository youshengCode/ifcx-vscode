import { components } from '../../reference/ifc5-development/schema/out/ts/ifcx';
import { formatSchemaTooltip } from '../utils/schema-formatter';

// Type aliases for easier access to the generated types
type IfcxValueDescription = components['schemas']['IfcxValueDescription'];

/**
 * Test function to demonstrate the schema formatter
 */
export function testSchemaFormatter() {
  // Example 1: Basic String type
  const stringSchema: IfcxValueDescription = {
    dataType: 'String',
  };
  console.log('Example 1: Basic String type');
  console.log(formatSchemaTooltip('bsi::name', stringSchema));
  console.log('\n');

  // Example 2: Real with Quantity
  const realWithQuantitySchema: IfcxValueDescription = {
    dataType: 'Real',
    quantityKind: 'Volume',
  };
  console.log('Example 2: Real with Quantity');
  console.log(formatSchemaTooltip('bsi::ifc::v5a::prop::volume', realWithQuantitySchema));
  console.log('\n');

  // Example 3: Object with simple properties
  const objectSchema: IfcxValueDescription = {
    dataType: 'Object',
    objectRestrictions: {
      values: {
        code: { dataType: 'String' },
        uri: { dataType: 'String' },
      },
    },
  };
  console.log('Example 3: Object with simple properties');
  console.log(formatSchemaTooltip('bsi::ifc::v5a::class', objectSchema));
  console.log('\n');

  // Example 4: Object with nested objects
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
  console.log('Example 4: Object with nested objects');
  console.log(formatSchemaTooltip('bsi::ifc::v5a::spaceboundary', nestedObjectSchema));
  console.log('\n');

  // Example 5: Array of Real
  const arraySchema: IfcxValueDescription = {
    dataType: 'Array',
    arrayRestrictions: {
      value: { dataType: 'Real' },
    },
  };
  console.log('Example 5: Array of Real');
  console.log(formatSchemaTooltip('usd::materials::inputs::diffuseColor', arraySchema));
  console.log('\n');

  // Example 6: Array of Array of Real
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
  console.log('Example 6: Array of Array of Real');
  console.log(formatSchemaTooltip('usd::xformop', nestedArraySchema));
  console.log('\n');

  // Example 7: Array with min/max
  const arrayWithLimitsSchema: IfcxValueDescription = {
    dataType: 'Array',
    arrayRestrictions: {
      min: 1,
      max: 30,
      value: { dataType: 'Integer' },
    },
  };
  console.log('Example 7: Array with min/max');
  console.log(formatSchemaTooltip('usd::usdgeom::mesh', arrayWithLimitsSchema));
  console.log('\n');

  // Example 8: Enum
  const enumSchema: IfcxValueDescription = {
    dataType: 'Enum',
    enumRestrictions: {
      options: ['A', 'B', 'C'],
    },
  };
  console.log('Example 8: Enum');
  console.log(formatSchemaTooltip('bsi::predefinedtypes', enumSchema));
  console.log('\n');

  // Example 9: Relation
  const relationSchema: IfcxValueDescription = {
    dataType: 'Relation',
    relationRestrictions: {
      type: 'ifc:RelDefinesByProperties',
    },
  };
  console.log('Example 9: Relation');
  console.log(formatSchemaTooltip('bsi::relationexample', relationSchema));
  console.log('\n');

  // Example 10: Object with inheritance
  const inheritingObjectSchema: IfcxValueDescription = {
    dataType: 'Object',
    inherits: ['bsi::ifc::v5a::class'],
  };
  console.log('Example 10: Object with inheritance');
  console.log(formatSchemaTooltip('nlsfb::class', inheritingObjectSchema));
  console.log('\n');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSchemaFormatter();
}
