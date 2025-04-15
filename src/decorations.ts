import * as vscode from 'vscode';

export function activateDecorations(context: vscode.ExtensionContext) {
  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: '#264f78',
    isWholeLine: false,
  });

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
          const startPos = activeEditor.document.positionAt(
            match.index + match[0].indexOf(match[1]) - 1
          ); // -1 to include quote
          const endPos = activeEditor.document.positionAt(
            match.index + match[0].indexOf(match[1]) + match[1].length + 1
          ); // +1 to include quote
          const range = new vscode.Range(startPos, endPos);

          decorations.push({
            range,
            hoverMessage: `Schema: ${match[1]}`,
          });
        }
      }
    }

    activeEditor.setDecorations(decorationType, decorations);
  }

  // Helper function to find the closing brace of an object
  function findClosingBrace(text: string, start: number): number {
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
}
