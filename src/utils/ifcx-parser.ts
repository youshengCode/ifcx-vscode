import * as fs from 'fs';
import { components } from '../../reference/ifc5-development/schema/out/ts/ifcx';

// Type aliases for easier access to the generated types
type IfcxFile = components['schemas']['IfcxFile'];
type IfcxNode = components['schemas']['IfcxNode'];
type IfcxSchema = components['schemas']['IfcxSchema'];
type IfcxValueDescription = components['schemas']['IfcxValueDescription'];

/**
 * Parses an IFCX file from a file path
 * @param filePath Path to the IFCX file
 * @returns Parsed IFCX file with proper typing
 * @throws Error if the file cannot be read or parsed
 */
export function parseIfcxFile(filePath: string): IfcxFile {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsedData = JSON.parse(fileContent) as IfcxFile;
    validateIfcxStructure(parsedData);
    return parsedData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse IFCX file: ${error.message}`);
    }
    throw new Error(
      `Error reading IFCX file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parses an IFCX file from a string content
 * @param content String content of the IFCX file
 * @returns Parsed IFCX file with proper typing
 * @throws Error if the content cannot be parsed
 */
export function parseIfcxContent(content: string): IfcxFile {
  try {
    const parsedData = JSON.parse(content) as IfcxFile;
    validateIfcxStructure(parsedData);
    return parsedData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse IFCX content: ${error.message}`);
    }
    throw new Error(
      `Error processing IFCX content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validates the basic structure of an IFCX file
 * @param data The parsed IFCX data
 * @throws Error if the structure is invalid
 */
function validateIfcxStructure(data: IfcxFile): void {
  const requiredFields = {
    header: ['version', 'author', 'timestamp'],
    schemas: [],
    data: [],
  };

  for (const [field, subFields] of Object.entries(requiredFields)) {
    if (!data[field as keyof IfcxFile]) {
      throw new Error(`IFCX file is missing ${field}`);
    }
    if (subFields.length > 0) {
      for (const subField of subFields) {
        if (!data.header[subField as keyof typeof data.header]) {
          throw new Error(`IFCX header is missing ${subField}`);
        }
      }
    }
  }
}

/**
 * Validates a node against its schema
 * @param node The node to validate
 * @param schemas The schemas to validate against
 * @returns True if the node is valid, false otherwise
 */
export function validateNode(node: IfcxNode, schemas: Record<string, IfcxSchema>): boolean {
  if (!node.identifier) return false;

  const schema = schemas[node.identifier];
  if (!schema) return false;

  return node.attributes ? validateValue(node.attributes, schema.value, schemas) : true;
}

/**
 * Validates a value against a value description
 * @param value The value to validate
 * @param valueDesc The value description to validate against
 * @param schemas The schemas to validate against
 * @returns True if the value is valid, false otherwise
 */
function validateValue(
  value: unknown,
  valueDesc: IfcxValueDescription,
  schemas: Record<string, IfcxSchema>
): boolean {
  let obj: Record<string, unknown>;
  let arrayValue: IfcxValueDescription;
  let min: number | undefined;
  let max: number | undefined;

  switch (valueDesc.dataType) {
    case 'Real':
      return typeof value === 'number';
    case 'Boolean':
      return typeof value === 'boolean';
    case 'Integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'String':
      return typeof value === 'string';
    case 'DateTime':
      return typeof value === 'string' && !isNaN(Date.parse(value as string));
    case 'Enum':
      return valueDesc.enumRestrictions
        ? typeof value === 'string' && valueDesc.enumRestrictions.options.includes(value as string)
        : false;
    case 'Array':
      if (!valueDesc.arrayRestrictions || !Array.isArray(value)) return false;

      ({ min, max, value: arrayValue } = valueDesc.arrayRestrictions);
      if (min !== undefined && value.length < min) return false;
      if (max !== undefined && value.length > max) return false;

      return value.every((item) => validateValue(item, arrayValue, schemas));
    case 'Object':
      if (!valueDesc.objectRestrictions || typeof value !== 'object' || value === null)
        return false;

      obj = value as Record<string, unknown>;
      return Object.entries(valueDesc.objectRestrictions.values).every(
        ([key, valueType]) => key in obj && validateValue(obj[key], valueType, schemas)
      );
    case 'Relation':
      return typeof value === 'string';
    default:
      return false;
  }
}

/**
 * Finds a node by its identifier
 * @param file The IFCX file to search in
 * @param identifier The identifier to search for
 * @returns The node if found, undefined otherwise
 */
export function findNodeByIdentifier(file: IfcxFile, identifier: string): IfcxNode | undefined {
  return file.data.find((node) => node.identifier === identifier);
}

/**
 * Gets all child nodes of a node
 * @param file The IFCX file
 * @param parentIdentifier The identifier of the parent node
 * @returns An array of child nodes
 */
export function getChildNodes(file: IfcxFile, parentIdentifier: string): IfcxNode[] {
  const parentNode = findNodeByIdentifier(file, parentIdentifier);
  if (!parentNode?.children) return [];

  return Object.values(parentNode.children)
    .filter((childId): childId is string => typeof childId === 'string')
    .map((childId) => findNodeByIdentifier(file, childId))
    .filter((node): node is IfcxNode => node !== undefined);
}

/**
 * Gets all nodes that inherit from a specific node
 * @param file The IFCX file
 * @param baseIdentifier The identifier of the base node
 * @returns An array of nodes that inherit from the base node
 */
export function getInheritingNodes(file: IfcxFile, baseIdentifier: string): IfcxNode[] {
  return file.data.filter(
    (node) =>
      node.inherits &&
      Object.values(node.inherits).some((inheritId) => inheritId === baseIdentifier)
  );
}
