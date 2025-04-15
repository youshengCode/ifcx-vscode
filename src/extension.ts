import * as vscode from 'vscode';
import { activateDecorations } from './decorations';

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 IFCX Syntax Support is now active!');
  activateDecorations(context);
}

export function deactivate() {}
