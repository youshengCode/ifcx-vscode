import * as path from 'path';
import * as fs from 'fs';
import { schemaTooltipProvider } from '../utils/schema-tooltip-provider';

/**
 * Example function that demonstrates how to use the SchemaTooltipProvider
 * with a real IFCX file
 */
export function runSchemaTooltipExample() {
  // Path to the sample IFCX file
  const sampleFilePath = path.resolve(
    __dirname,
    '../../reference/ifc5-sample-files/hello-wall.ifcx'
  );

  // Check if the file exists
  if (!fs.existsSync(sampleFilePath)) {
    console.error(`Sample file not found: ${sampleFilePath}`);
    return;
  }

  // Load schemas from the file
  schemaTooltipProvider.loadFromFile(sampleFilePath);

  // Get all schema names
  const schemaNames = schemaTooltipProvider.getSchemaNames();
  console.log(`Found ${schemaNames.length} schemas in the sample file.`);

  // Display tooltips for a few example schemas
  const exampleSchemas = [
    'bsi::name',
    'bsi::ifc::v5a::prop::volume',
    'bsi::ifc::v5a::class',
    'bsi::ifc::v5a::spaceboundary',
    'usd::materials::inputs::diffuseColor',
    'usd::xformop',
    'usd::usdgeom::mesh',
    'nlsfb::class',
  ];

  for (const schemaName of exampleSchemas) {
    if (schemaTooltipProvider.hasSchema(schemaName)) {
      const tooltip = schemaTooltipProvider.getTooltip(schemaName);
      console.log(`\n--- Tooltip for ${schemaName} ---`);
      console.log(tooltip);
    } else {
      console.log(`\nSchema not found: ${schemaName}`);
    }
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runSchemaTooltipExample();
}
