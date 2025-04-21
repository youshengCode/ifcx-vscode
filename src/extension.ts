import * as vscode from 'vscode';
import { activateSchemaDecorations } from './features/schema-decorations';
import { activateSchemaDefinition } from './features/schema-definition';
import { registerAutoFoldSchemas } from './features/auto-fold-schemas';
import { registerAutoFoldArrays } from './features/auto-fold-arrays';
import { activateIdentifierDecorations } from './features/identifier-decorations';
import { activateIdentifierDefinitions } from './features/identifier-definitions';

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 IFCX Syntax Support is now active!');

  // Get configuration
  const config = vscode.workspace.getConfiguration('ifcx');

  // Activate features based on configuration
  if (config.get('schemaDecoration.enabled', true)) {
    activateSchemaDecorations(context);
  }

  if (config.get('schemaDefinition.enabled', true)) {
    activateSchemaDefinition(context);
  }

  if (config.get('autoFoldSchema.enabled', true)) {
    registerAutoFoldSchemas(context);
  }

  if (config.get('autoFoldArray.enabled', true)) {
    registerAutoFoldArrays(context);
  }

  if (config.get('identifierDecoration.enabled', true)) {
    activateIdentifierDecorations(context);
  }

  if (config.get('identifierDefinition.enabled', true)) {
    activateIdentifierDefinitions(context);
  }

  // Register configuration change listener to update features when settings change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ifcx')) {
        // Reload the window to apply the new configuration
        vscode.window.showInformationMessage(
          'IFCX configuration changed. Please reload the window to apply changes.'
        );
      }
    })
  );
}

export function deactivate() {}
