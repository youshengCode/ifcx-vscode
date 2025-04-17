import * as vscode from 'vscode';
import { activateDecorations } from './features/decorations';
import { activateDefinitionProvider } from './features/definition';
import { registerAutoCollapseSchemas } from './features/auto-collapse-schemas';
import { registerAutoFoldArrays } from './features/auto-fold-arrays';

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 IFCX Syntax Support is now active!');

  activateDecorations(context);
  activateDefinitionProvider(context);
  registerAutoCollapseSchemas(context);
  registerAutoFoldArrays(context);
}

export function deactivate() {}
