import * as vscode from 'vscode';

export function createDecorationType(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
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
}
