import * as vscode from 'vscode';
import { activateSchemaDecorations } from './features/schema-decorations';
import { activateSchemaDefinition } from './features/schema-definition';
import { registerAutoFoldSchemas } from './features/auto-fold-schemas';
import { registerAutoFoldArrays } from './features/auto-fold-arrays';
import { activateIdentifierDecorations } from './features/identifier-decorations';
import { activateIdentifierDefinitions } from './features/identifier-definitions';

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 IFCX Syntax Support is now active!');

  activateSchemaDecorations(context);
  activateSchemaDefinition(context);

  registerAutoFoldSchemas(context);
  registerAutoFoldArrays(context);

  activateIdentifierDecorations(context);
  activateIdentifierDefinitions(context);
}

export function deactivate() {}
