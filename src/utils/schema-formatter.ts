import { components } from '../../reference/ifc5-development/schema/out/ts/ifcx';

// Type aliases for easier access to the generated types
type IfcxValueDescription = components['schemas']['IfcxValueDescription'];

/**
 * Formats an IFCX value description into a markdown tooltip string
 * following the format specified in feature-tooltip.mdc
 *
 * @param schemaName The name of the schema
 * @param valueDesc The value description to format
 * @returns A formatted markdown string for tooltip display
 */
export function formatSchemaTooltip(schemaName: string, valueDesc: IfcxValueDescription): string {
  const parts: string[] = [];

  // Add schema name
  parts.push(`**Schema:** \`${schemaName}\``);

  // Add data type
  parts.push(`**Type:** ${valueDesc.dataType}`);

  // Add quantity kind if present
  if (valueDesc.quantityKind) {
    parts.push(`**Quantity:** ${valueDesc.quantityKind}`);
  }

  // Add inherits if present
  if (valueDesc.inherits && valueDesc.inherits.length > 0) {
    parts.push(`**Inherits:** \`${valueDesc.inherits.join(', ')}\``);
  }

  // Add relation type if present
  if (valueDesc.relationRestrictions?.type) {
    parts.push(`**Relation:** \`${valueDesc.relationRestrictions.type}\``);
  }

  // Add enum options if present
  if (valueDesc.enumRestrictions?.options) {
    parts.push(`**Options:** [${valueDesc.enumRestrictions.options.join(', ')}]`);
  }

  // Handle object properties
  if (valueDesc.dataType === 'Object' && valueDesc.objectRestrictions?.values) {
    const objectProps = formatObjectProperties(valueDesc.objectRestrictions.values);
    if (objectProps.length > 0) {
      parts.push(...objectProps);
    }
  }

  // Handle array properties
  if (valueDesc.dataType === 'Array' && valueDesc.arrayRestrictions) {
    const arrayType = formatArrayType(valueDesc);
    parts.push(arrayType);
  }

  return parts.join('\n');
}

/**
 * Formats object properties for tooltip display
 *
 * @param values The object property values
 * @returns An array of formatted property strings
 */
function formatObjectProperties(values: Record<string, IfcxValueDescription>): string[] {
  const props: string[] = [];

  for (const [key, valueDesc] of Object.entries(values)) {
    if (valueDesc.dataType === 'Object' && valueDesc.objectRestrictions?.values) {
      // Handle nested objects
      const nestedProps = formatObjectProperties(valueDesc.objectRestrictions.values);
      props.push(`- \`${key}\`: Object`);
      props.push(...nestedProps.map((prop) => `  ${prop}`));
    } else if (valueDesc.dataType === 'Array') {
      // Handle array properties
      const arrayType = formatArrayType(valueDesc);
      props.push(`- \`${key}\`: ${arrayType.replace('- ', '')}`);
    } else {
      // Handle simple properties
      props.push(`- \`${key}\`: ${valueDesc.dataType}`);
    }
  }

  return props;
}

/**
 * Formats an array type for tooltip display
 *
 * @param valueDesc The value description
 * @returns A formatted array type string
 */
function formatArrayType(valueDesc: IfcxValueDescription): string {
  if (valueDesc.dataType !== 'Array' || !valueDesc.arrayRestrictions) {
    return valueDesc.dataType;
  }

  const { min, max, value } = valueDesc.arrayRestrictions;

  let baseType: string;
  if (value.dataType === 'Array') {
    // Handle nested arrays
    baseType = `Array of ${formatArrayType(value).replace('- ', '')}`;
  } else {
    baseType = `Array of ${value.dataType}`;
  }

  // Add min/max if present
  if (min !== undefined || max !== undefined) {
    const minStr = min !== undefined ? min.toString() : '*';
    const maxStr = max !== undefined ? max.toString() : '*';
    baseType = `Array[${minStr}..${maxStr}] of ${baseType.replace('Array of ', '')}`;
  }

  return `- ${baseType}`;
}
