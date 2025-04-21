import * as vscode from 'vscode';
import {
  extractIdentifierGraph,
  generateTooltipForIdentifier,
  IfcxNodeInfo,
} from '../utils/identifier-extractor';

// Global cache for identifiers
const identifierCache = new Map<string, Map<string, IfcxNodeInfo>>();
const identifierPositionsCache = new Map<string, Map<string, vscode.Range[]>>();

/**
 * Creates a decoration type for identifier highlighting
 */
function createDecorationType(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline',
    light: {
      textDecoration: 'underline #9932CC', // Purple for light theme
    },
    dark: {
      textDecoration: 'underline #DA70D6', // Lighter purple for dark theme
    },
    fontStyle: 'italic',
  });
}

/**
 * Updates the identifier cache and decorations for a document
 */
function updateIdentifierCache(document: vscode.TextDocument): void {
  const content = document.getText();
  const nodes = extractIdentifierGraph(content);
  identifierCache.set(document.uri.toString(), nodes);

  // Update positions cache for all identifiers
  const positions = new Map<string, vscode.Range[]>();
  const identifiers = Array.from(nodes.keys());

  // For each identifier, find all its occurrences in the document
  identifiers.forEach((id) => {
    const ranges: vscode.Range[] = [];
    let searchText = content;
    let totalOffset = 0;
    let pos = 0;

    while ((pos = searchText.indexOf(`"${id}"`)) >= 0) {
      // Get the start and end positions for this occurrence
      const startPos = document.positionAt(totalOffset + pos + 1); // +1 to skip the opening quote
      const endPos = document.positionAt(totalOffset + pos + id.length + 1);
      ranges.push(new vscode.Range(startPos, endPos));

      // Move past this occurrence
      totalOffset += pos + id.length + 2; // +2 for the quotes
      searchText = content.slice(totalOffset);
    }

    if (ranges.length > 0) {
      positions.set(id, ranges);
      console.log(`Found ${ranges.length} occurrences of identifier ${id}`);
      ranges.forEach((range, i) => {
        const text = document.getText(range);
        console.log(
          `  ${i + 1}: Line ${range.start.line + 1}, Character ${range.start.character}, Text: ${text}`
        );
      });
    }
  });

  identifierPositionsCache.set(document.uri.toString(), positions);
}

/**
 * Updates decorations in the active editor
 */
function updateDecorations(
  editor: vscode.TextEditor,
  decorationType: vscode.TextEditorDecorationType
) {
  const uri = editor.document.uri.toString();
  const positions = identifierPositionsCache.get(uri);
  if (!positions) {
    updateIdentifierCache(editor.document);
    return;
  }

  const decorations: vscode.DecorationOptions[] = [];

  // Add all identifier ranges to decorations
  for (const ranges of positions.values()) {
    ranges.forEach((range) => {
      decorations.push({ range });
    });
  }

  // Apply decorations
  editor.setDecorations(decorationType, decorations);
}

/**
 * Creates a hover provider for IFCX identifiers
 */
function createHoverProvider(): vscode.HoverProvider {
  return {
    provideHover: (document, position) => {
      // Get or update the identifier cache for this document
      let nodes = identifierCache.get(document.uri.toString());
      let positions = identifierPositionsCache.get(document.uri.toString());
      if (!nodes || !positions) {
        updateIdentifierCache(document);
        nodes = identifierCache.get(document.uri.toString());
        positions = identifierPositionsCache.get(document.uri.toString());
      }

      if (!nodes || !positions) return null;

      // Check if the position is within any identifier range
      for (const [id, ranges] of positions.entries()) {
        for (const range of ranges) {
          if (range.contains(position)) {
            console.log(
              `Hover triggered for identifier ${id} at line ${position.line + 1}, char ${position.character}`
            );
            const text = document.getText(range);
            console.log(`Hovering over text: ${text}`);

            // Generate tooltip content
            const tooltip = generateTooltipForIdentifier(id, nodes);
            const content = new vscode.MarkdownString(tooltip);
            content.isTrusted = true;
            content.supportHtml = true;

            // Create a command that will be executed when the link is clicked
            const commandUri = vscode.Uri.parse(`command:workbench.action.navigateBack`);

            // Find the definition range (where it appears as an identifier attribute)
            const node = nodes.get(id);
            if (node) {
              const defStartPos = document.positionAt(node.position + 1); // +1 to skip opening quote
              const defEndPos = document.positionAt(node.position + id.length + 1);
              const defRange = new vscode.Range(defStartPos, defEndPos);

              // Add a clickable link to go to definition
              content.appendMarkdown(
                `\n\n[Go to definition](${commandUri}) — or hold Ctrl and click the identifier.`
              );

              // Register a one-time command handler for this hover
              const disposable = vscode.commands.registerCommand(
                'workbench.action.navigateBack',
                () => {
                  // Navigate to the definition
                  vscode.window.showTextDocument(document, {
                    selection: defRange,
                    preserveFocus: false,
                  });
                  // Dispose the command handler after use
                  disposable.dispose();
                }
              );

              // Make sure to dispose the command handler when the hover is dismissed
              setTimeout(() => disposable.dispose(), 10000);
            }

            return new vscode.Hover(content, range);
          }
        }
      }

      return null;
    },
  };
}

/**
 * Creates a definition provider for IFCX identifiers
 */
function createDefinitionProvider(): vscode.DefinitionProvider {
  return {
    provideDefinition: (document, position) => {
      // Get or update the identifier cache for this document
      let nodes = identifierCache.get(document.uri.toString());
      let positions = identifierPositionsCache.get(document.uri.toString());
      if (!nodes || !positions) {
        updateIdentifierCache(document);
        nodes = identifierCache.get(document.uri.toString());
        positions = identifierPositionsCache.get(document.uri.toString());
      }

      if (!nodes || !positions) return null;

      // Check if the position is within any identifier range
      for (const [id, ranges] of positions.entries()) {
        for (const range of ranges) {
          if (range.contains(position)) {
            // Find the definition range (the first occurrence in the identifier attribute)
            const node = nodes.get(id);
            if (node) {
              const defStartPos = document.positionAt(node.position + 1); // +1 to skip opening quote
              const defEndPos = document.positionAt(node.position + id.length + 1);
              return new vscode.Location(document.uri, new vscode.Range(defStartPos, defEndPos));
            }
          }
        }
      }

      return null;
    },
  };
}

/**
 * Activates the identifier tooltips feature
 */
export function activateIdentifierTooltips(context: vscode.ExtensionContext) {
  // Create decoration type
  const decorationType = createDecorationType();
  let activeEditor = vscode.window.activeTextEditor;

  // Register the hover provider for IFCX files
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: 'file', language: 'ifcx' },
      createHoverProvider()
    )
  );

  // Register the definition provider for IFCX files
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { scheme: 'file', language: 'ifcx' },
      createDefinitionProvider()
    )
  );

  // Update decorations when document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (activeEditor && event.document === activeEditor.document) {
        updateIdentifierCache(event.document);
        updateDecorations(activeEditor, decorationType);
      }
    })
  );

  // Update decorations when active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      activeEditor = editor;
      if (editor && editor.document.languageId === 'ifcx') {
        updateIdentifierCache(editor.document);
        updateDecorations(editor, decorationType);
      }
    })
  );

  // Initial update for active editor
  if (activeEditor && activeEditor.document.languageId === 'ifcx') {
    updateIdentifierCache(activeEditor.document);
    updateDecorations(activeEditor, decorationType);
  }

  // Add disposal to context subscriptions
  context.subscriptions.push({ dispose: () => decorationType.dispose() });
}
