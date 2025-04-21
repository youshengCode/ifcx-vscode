import * as vscode from 'vscode';
import { activateIdentifierDecorations } from './identifier-decorations';
import { activateIdentifierDefinitions } from './identifier-definitions';

/**
 * Activates the identifier tooltips feature
 */
export function activateIdentifierTooltips(context: vscode.ExtensionContext) {
  // Activate the decoration feature
  activateIdentifierDecorations(context);

  // Activate the definition feature
  activateIdentifierDefinitions(context);
}
