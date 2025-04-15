import { Schema, SchemaValue } from './types';

// Text parsing utilities
export function findClosingBrace(text: string, start: number): number {
  let count = 1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') count++;
    else if (text[i] === '}') {
      count--;
      if (count === 0) return i;
    }
  }
  return -1;
}

export function getSchemaValue(text: string, startIndex: number): Schema | null {
  try {
    // Find the opening brace of the value object
    const valueMatch = text.slice(startIndex).match(/{\s*"value"\s*:\s*{/);
    if (!valueMatch) return null;

    const valueStart = startIndex + valueMatch.index! + valueMatch[0].length;
    const valueEnd = findClosingBrace(text, valueStart);
    if (valueEnd === -1) return null;

    // Parse the value object
    const valueText = text.slice(valueStart - 1, valueEnd + 1);
    return JSON.parse(`{"value":${valueText}}`) as Schema;
  } catch {
    return null;
  }
}

// Schema formatting utilities
function schemaValueToPlainText(value: SchemaValue, indent = ''): string {
  switch (value.dataType) {
    case 'String':
      return 'string';
    case 'Boolean':
      return 'boolean';
    case 'Integer':
      return 'integer number';
    case 'Real':
      return 'real number';
    case 'Array':
      if (value.arrayRestrictions) {
        return `array of ${schemaValueToPlainText(value.arrayRestrictions.value, indent + '  ')}`;
      }
      return 'array';
    case 'Object':
      if (value.objectRestrictions?.values) {
        const properties = Object.entries(value.objectRestrictions.values)
          .map(([key, val]) => `${indent}  ${key}: ${schemaValueToPlainText(val, indent + '  ')}`)
          .join('\n');
        return properties ? `object with:\n${properties}` : 'empty object';
      }
      return 'object';
    default:
      return 'unknown';
  }
}

export function formatHoverMessage(schemaName: string, schemaValue: Schema | null): string {
  const parts = schemaName.split(':');
  let message = '**Schema**\n\n';

  if (parts.length > 0) {
    message += '**Namespace:** ';
    const partsTexts = parts.map((part) => (part.trim().length > 0 ? `\`${part}\`` : `\`-\``));
    message += partsTexts.join(' → ');
    message += '\n\n';
  }

  if (schemaValue) {
    const { value } = schemaValue;
    message += `**Type Definition:**\n\`\`\`\n${schemaValueToPlainText(value)}\n\`\`\``;
  }

  return message;
}
