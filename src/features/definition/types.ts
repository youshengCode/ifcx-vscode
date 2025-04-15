import * as vscode from 'vscode';

export interface SchemaDefinition {
  name: string;
  range: vscode.Range;
  document: vscode.TextDocument;
  value: string;
}

export interface DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.Location | undefined;
}

export interface HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.Hover | undefined;
}
