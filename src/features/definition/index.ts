import * as vscode from 'vscode';
import { findClosingBrace } from '../decorations/utils';

// Cache for schema definitions
interface SchemaDefinition {
  name: string;
  range: vscode.Range;
  document: vscode.TextDocument;
  value?: string; // Add value property to store schema value
}

// Global cache for schema definitions
const schemaDefinitions = new Map<string, SchemaDefinition>();

export function activateDefinitionProvider(context: vscode.ExtensionContext) {
  // Register definition provider
  const definitionProvider = vscode.languages.registerDefinitionProvider(
    { scheme: 'file', language: 'ifcx' },
    {
      provideDefinition(document, position) {
        // Use a custom regex to match attribute names with colons
        const range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_:]+/);
        if (!range) return null;

        const word = document.getText(range);

        // Check if it's a schema name
        const schemaKey = `${document.uri.toString()}:${word}`;
        const schemaDefinition = schemaDefinitions.get(schemaKey);
        if (schemaDefinition) {
          return new vscode.Location(schemaDefinition.document.uri, schemaDefinition.range);
        }

        // Check if it's an attribute name (like "bsi::name")
        const attributeKey = `${document.uri.toString()}:attribute:${word}`;
        const attributeDefinition = schemaDefinitions.get(attributeKey);
        if (attributeDefinition) {
          return new vscode.Location(attributeDefinition.document.uri, attributeDefinition.range);
        }

        // Try to find a schema definition for this attribute
        const schemaDefinitionForAttribute = findSchemaDefinitionForAttribute(document, word);
        if (schemaDefinitionForAttribute) {
          return new vscode.Location(
            schemaDefinitionForAttribute.document.uri,
            schemaDefinitionForAttribute.range
          );
        }

        return null;
      },
    }
  );

  // Register hover provider
  const hoverProvider = vscode.languages.registerHoverProvider(
    { scheme: 'file', language: 'ifcx' },
    {
      provideHover(document, position) {
        // Use a custom regex to match attribute names with colons
        const range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_:]+/);
        if (!range) return null;

        const word = document.getText(range);
        const text = document.getText();

        // Check if we're in the schemas section
        const isInSchemasSection = isPositionInSchemasSection(document, position);

        if (isInSchemasSection) {
          // We're hovering over a schema name in the schemas section
          const schemaKey = `${document.uri.toString()}:${word}`;
          const schemaDefinition = schemaDefinitions.get(schemaKey);
          if (schemaDefinition) {
            return new vscode.Hover(
              new vscode.MarkdownString(
                `**Schema: ${schemaDefinition.name}**\n\nPress F12 to go to definition.`
              )
            );
          }
        } else {
          // We're hovering over an attribute in the data section
          // Check if it's a schema name
          const schemaKey = `${document.uri.toString()}:${word}`;
          const schemaDefinition = schemaDefinitions.get(schemaKey);
          if (schemaDefinition) {
            // Get the schema value
            const schemaValue = getSchemaValue(document, word);
            if (schemaValue) {
              return new vscode.Hover(
                new vscode.MarkdownString(
                  `**Schema: ${schemaDefinition.name}**\n\nSchema details:\n\`\`\`json\n${schemaValue}\n\`\`\`\n\nPress F12 to go to definition.`
                )
              );
            }
          }

          // Check if it's an attribute name (like "bsi::name")
          const attributeKey = `${document.uri.toString()}:attribute:${word}`;
          const attributeDefinition = schemaDefinitions.get(attributeKey);
          if (attributeDefinition) {
            // Find the schema definition for this attribute
            const schemaDefinitionForAttribute = findSchemaDefinitionForAttribute(document, word);
            if (schemaDefinitionForAttribute) {
              // Get the schema value
              const schemaValue = getSchemaValue(document, schemaDefinitionForAttribute.name);
              if (schemaValue) {
                return new vscode.Hover(
                  new vscode.MarkdownString(
                    `**Attribute: ${word}**\n\nSchema Definition:\n\`\`\`json\n${schemaValue}\n\`\`\`\n\nPress F12 to go to definition.`
                  )
                );
              }
            }
          }

          // Try to find a schema definition for this attribute
          const schemaDefinitionForAttribute = findSchemaDefinitionForAttribute(document, word);
          if (schemaDefinitionForAttribute) {
            // Get the schema value
            const schemaValue = getSchemaValue(document, schemaDefinitionForAttribute.name);
            if (schemaValue) {
              return new vscode.Hover(
                new vscode.MarkdownString(
                  `**Schema: ${schemaDefinitionForAttribute.name}**\n\nSchema details:\n\`\`\`json\n${schemaValue}\n\`\`\`\n\nPress F12 to go to definition.`
                )
              );
            }
          }
        }

        return null;
      },
    }
  );

  // Register document change listener to update schema definitions
  const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
    updateSchemaDefinitions(event.document);
  });

  // Register active editor change listener
  const activeEditorListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && editor.document.languageId === 'ifcx') {
      updateSchemaDefinitions(editor.document);
    }
  });

  // Initial update for active editor
  if (
    vscode.window.activeTextEditor &&
    vscode.window.activeTextEditor.document.languageId === 'ifcx'
  ) {
    updateSchemaDefinitions(vscode.window.activeTextEditor.document);
  }

  // Add disposables to context
  context.subscriptions.push(
    definitionProvider,
    hoverProvider,
    documentChangeListener,
    activeEditorListener
  );
}

function findSchemaDefinitionForAttribute(
  document: vscode.TextDocument,
  attributeName: string
): SchemaDefinition | null {
  // Check if the attribute name contains a namespace (e.g., "bsi::name")
  const parts = attributeName.split('::');
  if (parts.length > 1) {
    // Try to find a schema with this exact name
    const schemaKey = `${document.uri.toString()}:${attributeName}`;
    const schemaDefinition = schemaDefinitions.get(schemaKey);
    if (schemaDefinition) {
      return schemaDefinition;
    }

    // If not found, try to find a schema with just the last part
    const lastPart = parts[parts.length - 1];
    const schemaKeyLastPart = `${document.uri.toString()}:${lastPart}`;
    const schemaDefinitionLastPart = schemaDefinitions.get(schemaKeyLastPart);
    if (schemaDefinitionLastPart) {
      return schemaDefinitionLastPart;
    }
  }

  return null;
}

function isPositionInSchemasSection(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const text = document.getText();
  const positionOffset = document.offsetAt(position);

  // Find the schemas section
  const schemasMatch = text.match(/"schemas"\s*:\s*{/);
  if (!schemasMatch) return false;

  const schemasStart = schemasMatch.index! + schemasMatch[0].length;
  const schemasEnd = findClosingBrace(text, schemasStart);
  if (schemasEnd === -1) return false;

  // Check if the position is within the schemas section
  return positionOffset >= schemasStart && positionOffset <= schemasEnd;
}

function getSchemaValue(document: vscode.TextDocument, schemaName: string): string | null {
  const text = document.getText();

  try {
    // Parse the entire document as JSON
    const json = JSON.parse(text);

    // Get the schemas section
    if (json.schemas && json.schemas[schemaName]) {
      // Return the formatted schema value
      return JSON.stringify(json.schemas[schemaName], null, 2);
    }
  } catch (e) {
    // If JSON parsing fails, return null
    return null;
  }

  return null;
}

function updateSchemaDefinitions(document: vscode.TextDocument) {
  // Clear existing definitions for this document
  const docUri = document.uri.toString();
  for (const key of schemaDefinitions.keys()) {
    if (key.startsWith(docUri)) {
      schemaDefinitions.delete(key);
    }
  }

  const text = document.getText();

  // Find the schemas section
  const schemasMatch = text.match(/"schemas"\s*:\s*{/);
  if (schemasMatch) {
    const schemasStart = schemasMatch.index! + schemasMatch[0].length;
    const schemasEnd = findClosingBrace(text, schemasStart);
    if (schemasEnd === -1) return; // Invalid JSON

    // Match only the first level schema names within schemas object
    const schemaNameRegex = /\s+"([^"]+)"\s*:/g;
    schemaNameRegex.lastIndex = schemasStart;
    let match;

    while ((match = schemaNameRegex.exec(text))) {
      // Stop if we've gone past the schemas object
      if (match.index >= schemasEnd) break;

      // Only process if we're at the first level
      const beforeMatch = text.substring(schemasStart, match.index);
      const openBraces = (beforeMatch.match(/{/g) || []).length;
      const closeBraces = (beforeMatch.match(/}/g) || []).length;

      if (openBraces === closeBraces) {
        // We're at the first level
        // Calculate position for content only (without quotes)
        const startPos = document.positionAt(match.index + match[0].indexOf(match[1]));
        const endPos = document.positionAt(
          match.index + match[0].indexOf(match[1]) + match[1].length
        );
        const range = new vscode.Range(startPos, endPos);

        // Cache the schema definition
        const key = `${document.uri.toString()}:${match[1]}`;
        schemaDefinitions.set(key, {
          name: match[1],
          range,
          document,
        });

        // Also cache with the last part of the name for namespace attributes
        const parts = match[1].split('::');
        if (parts.length > 1) {
          const lastPart = parts[parts.length - 1];
          const lastPartKey = `${document.uri.toString()}:${lastPart}`;
          schemaDefinitions.set(lastPartKey, {
            name: lastPart,
            range,
            document,
          });
        }
      }
    }
  }

  // Find attribute definitions in the data section
  const dataMatch = text.match(/"data"\s*:\s*\[/);
  if (dataMatch) {
    const dataStart = dataMatch.index! + dataMatch[0].length;
    const dataEnd = findClosingBrace(text, dataStart);
    if (dataEnd === -1) return; // Invalid JSON

    // Find all attribute names in the data section
    const attributeRegex = /"([^"]+)"\s*:/g;
    attributeRegex.lastIndex = dataStart;
    let match;

    while ((match = attributeRegex.exec(text))) {
      // Stop if we've gone past the data array
      if (match.index >= dataEnd) break;

      const attributeName = match[1];

      // Skip common JSON keys that aren't schema attributes
      if (['name', 'children', 'inherits', 'attributes'].includes(attributeName)) {
        continue;
      }

      // Check if this attribute is defined in the schemas section
      const schemaKey = `${document.uri.toString()}:${attributeName}`;
      if (schemaDefinitions.has(schemaKey)) {
        // Calculate position for the attribute name
        const startPos = document.positionAt(match.index + 1); // +1 to skip the quote
        const endPos = document.positionAt(match.index + 1 + attributeName.length);
        const range = new vscode.Range(startPos, endPos);

        // Cache the attribute definition
        const key = `${document.uri.toString()}:attribute:${attributeName}`;
        schemaDefinitions.set(key, {
          name: attributeName,
          range,
          document,
        });
      }
    }
  }
}
