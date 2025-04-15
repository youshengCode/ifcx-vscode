import * as vscode from 'vscode';
import { Schema, SchemaValue } from './types';

export function activateDecorations(context: vscode.ExtensionContext) {
  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.symbolHighlightBackground'),
    color: new vscode.ThemeColor('editor.foreground'),
    light: {
      backgroundColor: '#2aa19855', // Light teal with transparency
    },
    dark: {
      backgroundColor: '#00b3b355', // Dark cyan with transparency
    },
    borderRadius: '3px',
    before: {
      contentText: '\u200B', // Zero-width space
      margin: '0 2px 0 0',
    },
    after: {
      contentText: '\u200B', // Zero-width space
      margin: '0 0 0 2px',
    },
  });

  let activeEditor = vscode.window.activeTextEditor;

  function schemaValueToPlainText(value: SchemaValue, indent = ''): string {
    switch (value.dataType) {
      case 'String':
        return 'string';
      case 'Boolean':
        return 'boolean';
      case 'Integer':
        return 'integer number';
      case 'Real':
        return 'real number';
      case 'Array':
        if (value.arrayRestrictions) {
          return `array of ${schemaValueToPlainText(value.arrayRestrictions.value, indent + '  ')}`;
        }
        return 'array';
      case 'Object':
        if (value.objectRestrictions?.values) {
          const properties = Object.entries(value.objectRestrictions.values)
            .map(([key, val]) => `${indent}  ${key}: ${schemaValueToPlainText(val, indent + '  ')}`)
            .join('\n');
          return properties ? `object with:\n${properties}` : 'empty object';
        }
        return 'object';
      default:
        return 'unknown';
    }
  }

  function getSchemaValue(text: string, startIndex: number): Schema | null {
    try {
      // Find the opening brace of the value object
      const valueMatch = text.slice(startIndex).match(/{\s*"value"\s*:\s*{/);
      if (!valueMatch) return null;

      const valueStart = startIndex + valueMatch.index! + valueMatch[0].length;
      const valueEnd = findClosingBrace(text, valueStart);
      if (valueEnd === -1) return null;

      // Parse the value object
      const valueText = text.slice(valueStart - 1, valueEnd + 1);
      return JSON.parse(`{"value":${valueText}}`) as Schema;
    } catch {
      return null;
    }
  }

  function formatDataTypeInfo(schema: Schema): string {
    const { value } = schema;
    const info = `**Type Definition:**\n\`\`\`\n${schemaValueToPlainText(value)}\n\`\`\``;
    return info;
  }

  function formatHoverMessage(
    schemaName: string,
    text: string,
    position: number
  ): vscode.MarkdownString {
    const parts = schemaName.split(':');
    const markdown = new vscode.MarkdownString();

    markdown.appendMarkdown('**Schema**\n\n');

    if (parts.length > 0) {
      markdown.appendMarkdown('**Namespace:** ');
      const partsTexts = parts.map((part) => (part.trim().length > 0 ? `\`${part}\`` : '-'));
      markdown.appendMarkdown(partsTexts.join(' → '));
      markdown.appendMarkdown('\n\n');
    }

    // Add data type information
    const schemaValue = getSchemaValue(text, position);
    if (schemaValue) {
      markdown.appendMarkdown(formatDataTypeInfo(schemaValue));
    }

    markdown.isTrusted = true;
    markdown.supportHtml = true;
    return markdown;
  }

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

          decorations.push({
            range,
            hoverMessage: formatHoverMessage(match[1], text, match.index),
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
