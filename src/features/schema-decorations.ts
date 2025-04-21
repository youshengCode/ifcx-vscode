import * as vscode from 'vscode';
import { components } from '../../reference/ifc5-development/schema/out/ts/ifcx';
import { parseIfcxContent } from '../utils/ifcx-parser';
import { schemaTooltipProvider } from '../utils/schema-tooltip-provider';

// Type aliases for easier access to the generated types
type IfcxFile = components['schemas']['IfcxFile'];

/**
 * Creates a decoration type for schema highlighting
 */
function createDecorationType(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline',
    light: {
      textDecoration: 'underline #2aa198',
    },
    dark: {
      textDecoration: 'underline #00b3b3',
    },
    fontStyle: 'italic',
  });
}

/**
 * Parses the IFCX content from a string
 */
function parseIfcxFileContent(content: string): IfcxFile | null {
  try {
    return parseIfcxContent(content);
  } catch (error) {
    console.error(`Failed to parse IFCX content: ${error}`);
    return null;
  }
}

/**
 * Activates the schema decorations feature
 */
export function activateSchemaDecorations(context: vscode.ExtensionContext) {
  const decorationType = createDecorationType();
  let activeEditor = vscode.window.activeTextEditor;

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    const text = activeEditor.document.getText();
    const decorations: vscode.DecorationOptions[] = [];

    // Parse the IFCX content and load schemas
    const ifcxFile = parseIfcxFileContent(text);
    if (ifcxFile) {
      // Load schemas into the tooltip provider
      schemaTooltipProvider.loadFromContent(text);

      // Get all schema names
      const schemaNames = Object.keys(ifcxFile.schemas);

      // Find schema names in the document
      for (const schemaName of schemaNames) {
        // Create a regex to find the schema name in the document
        const schemaRegex = new RegExp(`"${schemaName}"\\s*:`, 'g');
        let match;

        while ((match = schemaRegex.exec(text))) {
          // Calculate position for content only (without quotes)
          const startPos = activeEditor.document.positionAt(
            match.index + 1 // +1 to skip the opening quote
          );
          const endPos = activeEditor.document.positionAt(match.index + 1 + schemaName.length);
          const range = new vscode.Range(startPos, endPos);

          // Add decoration without tooltip
          decorations.push({ range });
        }
      }
    }

    activeEditor.setDecorations(decorationType, decorations);
  }

  function triggerUpdateDecorations() {
    if (activeEditor) {
      updateDecorations();
    }
  }

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  // Add disposal to context subscriptions
  context.subscriptions.push({ dispose: () => decorationType.dispose() });
}
