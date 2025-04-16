import * as vscode from 'vscode';

class IfcxFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    context: vscode.FoldingContext,
    token: vscode.CancellationToken
  ): vscode.FoldingRange[] {
    // Only process .ifcx files
    if (!document.fileName.endsWith('.ifcx')) {
      return [];
    }

    const foldingRanges: vscode.FoldingRange[] = [];
    const text = document.getText();

    // Find the schemas section at the root level
    const schemasStart = text.indexOf('"schemas": {');
    if (schemasStart !== -1) {
      // Find the end of the schemas section
      let bracketCount = 0;
      let schemasEnd = schemasStart;
      let foundStart = false;

      for (let i = schemasStart; i < text.length; i++) {
        if (text[i] === '{') {
          bracketCount++;
          foundStart = true;
        } else if (text[i] === '}') {
          bracketCount--;
          if (foundStart && bracketCount === 0) {
            schemasEnd = i + 1;
            break;
          }
        }
      }

      if (schemasEnd > schemasStart) {
        const startPosition = document.positionAt(schemasStart);
        const endPosition = document.positionAt(schemasEnd);
        foldingRanges.push(
          new vscode.FoldingRange(
            startPosition.line,
            endPosition.line,
            vscode.FoldingRangeKind.Region
          )
        );
      }
    }

    return foldingRanges;
  }
}

/**
 * Registers the auto-collapse functionality for .ifcx files
 */
export function registerAutoCollapseSchemas(context: vscode.ExtensionContext) {
  // Register the folding provider for .ifcx files
  const foldingProvider = new IfcxFoldingProvider();

  // Register for both JSON and plaintext to ensure it works with .ifcx files
  const jsonDisposable = vscode.languages.registerFoldingRangeProvider(
    { scheme: 'file', language: 'json' },
    foldingProvider
  );

  const plaintextDisposable = vscode.languages.registerFoldingRangeProvider(
    { scheme: 'file', language: 'plaintext' },
    foldingProvider
  );

  // Add the disposables to the extension's subscriptions
  context.subscriptions.push(jsonDisposable, plaintextDisposable);

  // Also register a document open handler to auto-collapse the schemas section
  const openHandler = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.fileName.endsWith('.ifcx')) {
      // Use a small delay to ensure the document is fully loaded
      setTimeout(() => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === document) {
          // Find the schemas section
          const text = document.getText();
          const schemasStart = text.indexOf('"schemas": {');
          if (schemasStart !== -1) {
            // Find the end of the schemas section
            let bracketCount = 0;
            let schemasEnd = schemasStart;
            let foundStart = false;

            for (let i = schemasStart; i < text.length; i++) {
              if (text[i] === '{') {
                bracketCount++;
                foundStart = true;
              } else if (text[i] === '}') {
                bracketCount--;
                if (foundStart && bracketCount === 0) {
                  schemasEnd = i + 1;
                  break;
                }
              }
            }

            if (schemasEnd > schemasStart) {
              const startPosition = document.positionAt(schemasStart);
              const endPosition = document.positionAt(schemasEnd);

              // Create a selection and fold it
              editor.selection = new vscode.Selection(startPosition, endPosition);
              vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'down' });
            }
          }
        }
      }, 100);
    }
  });

  context.subscriptions.push(openHandler);
}
