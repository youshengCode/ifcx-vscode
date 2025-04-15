import * as vscode from 'vscode';
import { activateDecorations } from './features/decorations';

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 IFCX Syntax Support is now active!');

  // Activate decorations
  activateDecorations(context);
}

export function deactivate() {}
