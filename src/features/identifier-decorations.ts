import * as vscode from 'vscode';
import { extractIdentifierGraph, IfcxNodeInfo } from '../utils/identifier-extractor';

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
 * Activates the identifier decorations feature
 */
export function activateIdentifierDecorations(context: vscode.ExtensionContext) {
  // Create decoration type
  const decorationType = createDecorationType();
  let activeEditor = vscode.window.activeTextEditor;

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

// Export the cache for use by other features
export function getIdentifierCache() {
  return identifierCache;
}

export function getIdentifierPositionsCache() {
  return identifierPositionsCache;
}
