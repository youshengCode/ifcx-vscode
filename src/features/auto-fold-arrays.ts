import * as vscode from 'vscode';

// Configuration constant for the minimum number of elements to trigger folding
// This can be moved to extension settings in the future
const MIN_ARRAY_ELEMENTS_TO_FOLD = 10;

/**
 * Auto-folds array properties in the attributes section of data elements
 * that have more than MIN_ARRAY_ELEMENTS_TO_FOLD elements
 */
export function registerAutoFoldArrays(context: vscode.ExtensionContext) {
  // Register a document open handler to auto-fold array properties
  const openHandler = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.fileName.endsWith('.ifcx')) {
      // Use a small delay to ensure the document is fully loaded
      setTimeout(() => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === document) {
          foldLargeArrays(editor);
        }
      }, 100);
    }
  });

  // Also register for when the active editor changes to handle tab switches
  const activeEditorHandler = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && editor.document.fileName.endsWith('.ifcx')) {
      // Use a small delay to ensure the document is fully loaded
      setTimeout(() => {
        foldLargeArrays(editor);
      }, 100);
    }
  });

  // Register a folding provider for array properties
  const foldingProvider = new IfcxArrayFoldingProvider();
  const jsonDisposable = vscode.languages.registerFoldingRangeProvider(
    { scheme: 'file', language: 'json' },
    foldingProvider
  );

  const plaintextDisposable = vscode.languages.registerFoldingRangeProvider(
    { scheme: 'file', language: 'plaintext' },
    foldingProvider
  );

  // Add the disposables to the extension's subscriptions
  context.subscriptions.push(openHandler, activeEditorHandler, jsonDisposable, plaintextDisposable);
}

/**
 * Folds array properties in the current editor that have more than MIN_ARRAY_ELEMENTS_TO_FOLD elements
 */
function foldLargeArrays(editor: vscode.TextEditor) {
  const document = editor.document;
  const text = document.getText();

  // Find all array properties in the document
  findAndFoldArrays(text, document, editor);
}

/**
 * Recursively finds and folds arrays in the document
 */
function findAndFoldArrays(text: string, document: vscode.TextDocument, editor: vscode.TextEditor) {
  // Find all array properties
  const arrayPropertyRegex = /"([^"]+)":\s*\[/g;
  let match;

  while ((match = arrayPropertyRegex.exec(text)) !== null) {
    const propertyName = match[1];
    const arrayStart = match.index + match[0].length;

    // Find the end of the array
    let bracketCount = 1; // We're starting after the opening bracket
    let arrayEnd = arrayStart;

    for (let i = arrayStart; i < text.length; i++) {
      if (text[i] === '[') {
        bracketCount++;
      } else if (text[i] === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          arrayEnd = i + 1;
          break;
        }
      }
    }

    if (arrayEnd > arrayStart) {
      // Count the number of elements in the array
      const arrayContent = text.substring(arrayStart, arrayEnd - 1);
      const elementCount = countArrayElements(arrayContent);

      // Only fold if the array has more than the minimum number of elements
      if (elementCount > MIN_ARRAY_ELEMENTS_TO_FOLD) {
        const startPosition = document.positionAt(arrayStart);
        const endPosition = document.positionAt(arrayEnd);

        // Create a selection and fold it
        editor.selection = new vscode.Selection(startPosition, endPosition);
        vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'down' });
      }

      // Recursively look for nested arrays within this array
      const nestedText = text.substring(arrayStart, arrayEnd - 1);
      findAndFoldArrays(nestedText, document, editor);
    }
  }
}

/**
 * Counts the number of elements in an array string
 * This is a simple implementation that counts commas + 1
 * It may need to be improved for nested arrays
 */
function countArrayElements(arrayContent: string): number {
  // Remove whitespace to simplify counting
  const cleanContent = arrayContent.replace(/\s+/g, '');

  // Handle empty array
  if (cleanContent === '') {
    return 0;
  }

  // Count top-level elements by counting commas
  let commaCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '[' || char === '{') {
        bracketCount++;
      } else if (char === ']' || char === '}') {
        bracketCount--;
      } else if (char === ',' && bracketCount === 0) {
        commaCount++;
      }
    }
  }

  // The number of elements is the number of commas + 1
  return commaCount + 1;
}

/**
 * Folding provider for array properties in IFCX files
 */
class IfcxArrayFoldingProvider implements vscode.FoldingRangeProvider {
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

    // Find all array properties in the document
    this.findArrayFoldingRanges(text, document, foldingRanges);

    return foldingRanges;
  }

  /**
   * Recursively finds array folding ranges in the document
   */
  private findArrayFoldingRanges(
    text: string,
    document: vscode.TextDocument,
    foldingRanges: vscode.FoldingRange[]
  ): void {
    // Find all array properties
    const arrayPropertyRegex = /"([^"]+)":\s*\[/g;
    let match;

    while ((match = arrayPropertyRegex.exec(text)) !== null) {
      const propertyName = match[1];
      const arrayStart = match.index + match[0].length;

      // Find the end of the array
      let bracketCount = 1; // We're starting after the opening bracket
      let arrayEnd = arrayStart;

      for (let i = arrayStart; i < text.length; i++) {
        if (text[i] === '[') {
          bracketCount++;
        } else if (text[i] === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            arrayEnd = i + 1;
            break;
          }
        }
      }

      if (arrayEnd > arrayStart) {
        // Count the number of elements in the array
        const arrayContent = text.substring(arrayStart, arrayEnd - 1);
        const elementCount = countArrayElements(arrayContent);

        // Only add folding range if the array has more than the minimum number of elements
        if (elementCount > MIN_ARRAY_ELEMENTS_TO_FOLD) {
          const startPosition = document.positionAt(arrayStart);
          const endPosition = document.positionAt(arrayEnd);

          foldingRanges.push(
            new vscode.FoldingRange(
              startPosition.line,
              endPosition.line,
              vscode.FoldingRangeKind.Region
            )
          );
        }

        // Recursively look for nested arrays within this array
        const nestedText = text.substring(arrayStart, arrayEnd - 1);
        this.findArrayFoldingRanges(nestedText, document, foldingRanges);
      }
    }
  }
}
