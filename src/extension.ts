import * as vscode from 'vscode';
// import { activateDecorations } from './features/decorations';
import { activateDefinitionProvider } from './features/definition';

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 IFCX Syntax Support is now active!');

  // activateDecorations(context);
  activateDefinitionProvider(context);
}

export function deactivate() {}
