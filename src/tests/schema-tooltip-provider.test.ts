import * as path from 'path';
import * as fs from 'fs';
import { schemaTooltipProvider } from '../utils/schema-tooltip-provider';

describe('Schema Tooltip Provider', () => {
  const sampleFilePath = path.resolve(
    __dirname,
    '../../reference/ifc5-sample-files/hello-wall.ifcx'
  );

  beforeEach(() => {
    // Reset the provider before each test
    schemaTooltipProvider.loadFromFile(sampleFilePath);
  });

  it('should load schemas from file', () => {
    const schemaNames = schemaTooltipProvider.getSchemaNames();
    expect(schemaNames.length).toBeGreaterThan(0);
  });

  it('should provide tooltips for basic schemas', () => {
    const basicSchemas = [
      'bsi::name',
      'bsi::ifc::v5a::prop::volume',
      'bsi::ifc::v5a::class',
      'bsi::ifc::v5a::spaceboundary',
      'usd::materials::inputs::diffuseColor',
      'usd::xformop',
      'usd::usdgeom::mesh',
      'nlsfb::class',
    ];

    for (const schemaName of basicSchemas) {
      expect(schemaTooltipProvider.hasSchema(schemaName)).toBe(true);
      const tooltip = schemaTooltipProvider.getTooltip(schemaName);
      expect(tooltip).toBeDefined();
      expect(typeof tooltip).toBe('string');
    }
  });

  it('should return undefined for non-existent schemas', () => {
    const tooltip = schemaTooltipProvider.getTooltip('non::existent::schema');
    expect(tooltip).toBeUndefined();
  });

  it('should correctly check schema existence', () => {
    expect(schemaTooltipProvider.hasSchema('bsi::name')).toBe(true);
    expect(schemaTooltipProvider.hasSchema('non::existent::schema')).toBe(false);
  });

  it('should handle loading invalid file content', () => {
    const invalidContent = '{ invalid json }';
    schemaTooltipProvider.loadFromContent(invalidContent);
    expect(schemaTooltipProvider.getSchemaNames().length).toBe(0);
  });

  it('should load schemas from valid content', () => {
    const validContent = JSON.stringify({
      header: {
        version: 'ifcx_alpha',
        author: 'test',
        timestamp: 'now',
      },
      schemas: {
        'test::schema': {
          value: {
            dataType: 'String',
          },
        },
      },
      data: [],
    });

    schemaTooltipProvider.loadFromContent(validContent);
    expect(schemaTooltipProvider.hasSchema('test::schema')).toBe(true);
  });

  it('should generate a markdown file of all schemas in hello-wall.ifcx', () => {
    // Ensure the generated directory exists
    const generatedDir = path.resolve(__dirname, '../../generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    // Get all schema names
    const schemaNames = schemaTooltipProvider.getSchemaNames();
    expect(schemaNames.length).toBeGreaterThan(0);

    // Create markdown content
    let markdownContent = `# IFCX Schemas from hello-wall.ifcx\n\n`;
    markdownContent += `This file was automatically generated from the hello-wall.ifcx sample file.\n\n`;
    markdownContent += `## Schemas\n\n`;

    // Add each schema to the markdown
    for (const schemaName of schemaNames) {
      const tooltip = schemaTooltipProvider.getTooltip(schemaName);
      if (tooltip) {
        markdownContent += `### ${schemaName}\n\n`;
        markdownContent += `${tooltip}\n\n`;
      }
    }

    // Write the markdown file
    const outputPath = path.resolve(generatedDir, 'hello-wall-schemas.md');
    fs.writeFileSync(outputPath, markdownContent);

    // Verify the file was created
    expect(fs.existsSync(outputPath)).toBe(true);

    // Verify the file content
    const fileContent = fs.readFileSync(outputPath, 'utf8');
    expect(fileContent).toContain('# IFCX Schemas from hello-wall.ifcx');
    expect(fileContent).toContain('bsi::name');
    expect(fileContent).toContain('usd::usdgeom::mesh');
  });
});
