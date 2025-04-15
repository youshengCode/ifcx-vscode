import * as vscode from 'vscode';
import { createDecorationType } from './styles';
import { formatHoverMessage, findClosingBrace, getSchemaValue } from './utils';

export function activateDecorations(context: vscode.ExtensionContext) {
  const decorationType = createDecorationType();
  let activeEditor = vscode.window.activeTextEditor;

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    const text = activeEditor.document.getText();
    const decorations: vscode.DecorationOptions[] = [];

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
          const startPos = activeEditor.document.positionAt(
            match.index + match[0].indexOf(match[1])
          );
          const endPos = activeEditor.document.positionAt(
            match.index + match[0].indexOf(match[1]) + match[1].length
          );
          const range = new vscode.Range(startPos, endPos);

          // Get schema value for hover message
          const schemaValue = getSchemaValue(text, match.index);

          // Create markdown string for hover message
          const markdown = new vscode.MarkdownString(formatHoverMessage(match[1], schemaValue));
          markdown.isTrusted = true;
          markdown.supportHtml = true;

          decorations.push({
            range,
            hoverMessage: markdown,
          });
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
