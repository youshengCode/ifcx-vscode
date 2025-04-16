import { components } from '../../reference/ifc5-development/schema/out/ts/ifcx';
import { formatSchemaTooltip } from './schema-formatter';
import { parseIfcxFile, parseIfcxContent } from './ifcx-parser';

// Type aliases for easier access to the generated types
type IfcxSchema = components['schemas']['IfcxSchema'];

/**
 * Provides tooltip information for IFCX schemas
 */
export class SchemaTooltipProvider {
  private schemas: Record<string, IfcxSchema> = {};

  /**
   * Loads schemas from an IFCX file
   *
   * @param filePath Path to the IFCX file
   */
  loadFromFile(filePath: string): void {
    try {
      const ifcxFile = parseIfcxFile(filePath);
      this.schemas = ifcxFile.schemas;
    } catch (error) {
      console.error(`Failed to load schemas from file: ${error}`);
    }
  }

  /**
   * Loads schemas from IFCX content
   *
   * @param content IFCX file content as a string
   */
  loadFromContent(content: string): void {
    try {
      const ifcxFile = parseIfcxContent(content);
      this.schemas = ifcxFile.schemas;
    } catch (error) {
      console.error(`Failed to load schemas from content: ${error}`);
    }
  }

  /**
   * Gets a tooltip for a schema
   *
   * @param schemaName The name of the schema
   * @returns A formatted tooltip string, or undefined if the schema is not found
   */
  getTooltip(schemaName: string): string | undefined {
    const schema = this.schemas[schemaName];
    if (!schema) {
      return undefined;
    }

    return formatSchemaTooltip(schemaName, schema.value);
  }

  /**
   * Gets all available schema names
   *
   * @returns An array of schema names
   */
  getSchemaNames(): string[] {
    return Object.keys(this.schemas);
  }

  /**
   * Checks if a schema exists
   *
   * @param schemaName The name of the schema
   * @returns True if the schema exists, false otherwise
   */
  hasSchema(schemaName: string): boolean {
    return schemaName in this.schemas;
  }
}

/**
 * Creates a singleton instance of the SchemaTooltipProvider
 */
export const schemaTooltipProvider = new SchemaTooltipProvider();
