import * as vscode from 'vscode';
import { SchemaDefinition } from './types';

// Global cache for schema definitions
export const schemaDefinitions = new Map<string, SchemaDefinition>();

export function clearDefinitionsForDocument(document: vscode.TextDocument): void {
  for (const [key, def] of schemaDefinitions.entries()) {
    if (def.document === document) {
      schemaDefinitions.delete(key);
    }
  }
}

export function getWordRangeAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Range | undefined {
  return document.getWordRangeAtPosition(position, /[a-zA-Z0-9_:]+/);
}

export function findSchemaDefinitionForAttribute(
  attributeName: string
): SchemaDefinition | undefined {
  // If the attribute name contains a namespace (e.g., "bsi::name")
  if (attributeName.includes('::')) {
    const parts = attributeName.split('::');
    const schemaName = parts[parts.length - 1];
    return schemaDefinitions.get(schemaName);
  }
  return schemaDefinitions.get(attributeName);
}

export function getSchemaValue(
  document: vscode.TextDocument,
  schemaName: string
): string | undefined {
  try {
    const json = JSON.parse(document.getText());
    const schema = json.schemas?.[schemaName];
    if (schema) {
      return JSON.stringify(schema, null, 2);
    }
  } catch (error) {
    console.error('Error parsing schema value:', error);
  }
  return undefined;
}

export function updateSchemaDefinitions(document: vscode.TextDocument): void {
  clearDefinitionsForDocument(document);

  try {
    const json = JSON.parse(document.getText());
    const schemas = json.schemas || {};

    // Cache schema definitions
    for (const [name, value] of Object.entries(schemas)) {
      const schemaText = document.getText();
      const nameIndex = schemaText.indexOf(`"${name}"`);
      if (nameIndex !== -1) {
        const startPos = document.positionAt(nameIndex);
        const endPos = document.positionAt(nameIndex + name.length);
        const range = new vscode.Range(startPos, endPos);

        const definition: SchemaDefinition = {
          name,
          range,
          document,
          value: JSON.stringify(value, null, 2),
        };

        // Cache both the full name and the last part for namespaced attributes
        schemaDefinitions.set(name, definition);
        if (name.includes('::')) {
          const lastPart = name.split('::').pop()!;
          schemaDefinitions.set(lastPart, definition);
        }
      }
    }
  } catch (error) {
    console.error('Error updating schema definitions:', error);
  }
}
