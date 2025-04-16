import * as vscode from 'vscode';
import { parseIfcxContent } from '../utils/ifcx-parser';
import { schemaTooltipProvider } from '../utils/schema-tooltip-provider';

// Interface for schema definitions
interface SchemaDefinition {
  name: string;
  range: vscode.Range;
  document: vscode.TextDocument;
}

// Global cache for schema definitions
const schemaDefinitions = new Map<string, SchemaDefinition>();

/**
 * Clears schema definitions for a specific document
 */
function clearDefinitionsForDocument(document: vscode.TextDocument): void {
  for (const [key, def] of schemaDefinitions.entries()) {
    if (def.document === document) {
      schemaDefinitions.delete(key);
    }
  }
}

/**
 * Updates schema definitions for a document
 */
function updateSchemaDefinitions(document: vscode.TextDocument): void {
  clearDefinitionsForDocument(document);

  try {
    // Parse the IFCX content
    const ifcxFile = parseIfcxContent(document.getText());

    // Load schemas into the tooltip provider
    schemaTooltipProvider.loadFromContent(document.getText());

    // Cache schema definitions
    for (const [name, schema] of Object.entries(ifcxFile.schemas)) {
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

/**
 * Schema Definition Provider implementation
 */
class SchemaDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.Location | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_:]+/);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);
    const definition = schemaDefinitions.get(word);

    if (definition) {
      return new vscode.Location(definition.document.uri, definition.range);
    }

    return undefined;
  }
}

/**
 * Schema Hover Provider implementation
 */
class SchemaHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_:]+/);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);
    const definition = schemaDefinitions.get(word);

    if (definition) {
      // Get tooltip for the schema
      const tooltipText = schemaTooltipProvider.getTooltip(definition.name);

      if (tooltipText) {
        const content = new vscode.MarkdownString(tooltipText);
        content.isTrusted = true;
        content.supportHtml = true;

        // Create a command that will be executed when the link is clicked
        const args = [definition.document.uri, definition.range.start];
        const commandUri = vscode.Uri.parse(`command:workbench.action.navigateBack`);

        // Add a clickable link to go to definition
        content.appendMarkdown(`\n\n[Go to definition](${commandUri})`);

        // Register a one-time command handler for this hover
        const disposable = vscode.commands.registerCommand('workbench.action.navigateBack', () => {
          // Navigate to the definition
          vscode.window.showTextDocument(definition.document, {
            selection: definition.range,
            preserveFocus: false,
          });
          // Dispose the command handler after use
          disposable.dispose();
        });

        // Make sure to dispose the command handler when the hover is dismissed
        setTimeout(() => disposable.dispose(), 10000);

        return new vscode.Hover(content, wordRange);
      }
    }

    return undefined;
  }
}

/**
 * Activates the definition provider feature
 */
export function activateDefinitionProvider(context: vscode.ExtensionContext) {
  // Register definition provider
  const definitionProvider = new SchemaDefinitionProvider();
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { scheme: 'file', language: 'ifcx' },
      definitionProvider
    )
  );

  // Register hover provider
  const hoverProvider = new SchemaHoverProvider();
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: 'file', language: 'ifcx' }, hoverProvider)
  );

  // Update definitions when the active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === 'ifcx') {
        updateSchemaDefinitions(editor.document);
      }
    })
  );

  // Update definitions when the document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'ifcx') {
        updateSchemaDefinitions(event.document);
      }
    })
  );

  // Initial update for active editor
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && activeEditor.document.languageId === 'ifcx') {
    updateSchemaDefinitions(activeEditor.document);
  }
}
