import * as vscode from 'vscode';
import { DefinitionProvider, HoverProvider, SchemaDefinition } from './types';
import { getSchemaValue } from '../decorations/utils';

export class SchemaDefinitionProvider implements DefinitionProvider {
  constructor(private schemaDefinitions: Map<string, SchemaDefinition>) {}

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.Location | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_:]+/);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);
    const definition = this.schemaDefinitions.get(word);

    if (definition) {
      return new vscode.Location(definition.document.uri, definition.range);
    }

    return undefined;
  }
}

export class SchemaHoverProvider implements HoverProvider {
  constructor(private schemaDefinitions: Map<string, SchemaDefinition>) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_:]+/);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);
    const definition = this.schemaDefinitions.get(word);

    if (definition) {
      const text = document.getText();
      const schemaValue = getSchemaValue(text, document.offsetAt(definition.range.start));
      const content = new vscode.MarkdownString();
      content.isTrusted = true;
      content.supportHtml = true;

      content.appendMarkdown(`**Schema: ${definition.name}**\n\n`);
      if (schemaValue) {
        content.appendMarkdown('```json\n');
        content.appendMarkdown(JSON.stringify(schemaValue, null, 2));
        content.appendMarkdown('\n```\n\n');
      }
      content.appendMarkdown('*Press F12 to go to definition*');

      return new vscode.Hover(content, wordRange);
    }

    return undefined;
  }
}
