import * as vscode from 'vscode';
import { SchemaDefinitionProvider, SchemaHoverProvider } from './providers';
import { schemaDefinitions, updateSchemaDefinitions } from './utils';

export function activateDefinitionProvider(context: vscode.ExtensionContext) {
  // Register definition provider
  const definitionProvider = new SchemaDefinitionProvider(schemaDefinitions);
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { scheme: 'file', language: 'ifcx' },
      definitionProvider
    )
  );

  // Register hover provider
  const hoverProvider = new SchemaHoverProvider(schemaDefinitions);
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: 'file', language: 'ifcx' }, hoverProvider)
  );

  // Update definitions when the active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === 'ifcx') {
        updateSchemaDefinitions(editor.document);
      }
    })
  );

  // Update definitions when the document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'ifcx') {
        updateSchemaDefinitions(event.document);
      }
    })
  );

  // Initial update for active editor
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && activeEditor.document.languageId === 'ifcx') {
    updateSchemaDefinitions(activeEditor.document);
  }
}
