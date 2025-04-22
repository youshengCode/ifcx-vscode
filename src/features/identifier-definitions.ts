import * as vscode from 'vscode';
import { generateTooltipForIdentifier } from '../utils/identifier-extractor';
import { getIdentifierCache, getIdentifierPositionsCache } from './identifier-decorations';

/**
 * Creates a hover provider for IFCX identifiers
 */
function createHoverProvider(): vscode.HoverProvider {
  return {
    provideHover: (document, position) => {
      // Get the identifier cache for this document
      const nodes = getIdentifierCache().get(document.uri.toString());
      const positions = getIdentifierPositionsCache().get(document.uri.toString());

      if (!nodes || !positions) return null;

      // Check if the position is within any identifier range
      for (const [id, ranges] of positions.entries()) {
        for (const range of ranges) {
          if (range.contains(position)) {
            console.log(
              `Hover triggered for identifier ${id} at line ${position.line + 1}, char ${position.character}`
            );
            const text = document.getText(range);
            console.log(`Hovering over text: ${text}`);

            // Generate tooltip content
            const tooltip = generateTooltipForIdentifier(id, nodes);
            const content = new vscode.MarkdownString(tooltip);
            content.isTrusted = true;
            content.supportHtml = true;

            // Create a command that will be executed when the link is clicked
            const commandUri = vscode.Uri.parse(`command:workbench.action.navigateBack`);

            // Find the definition range (where it appears as an identifier attribute)
            const node = nodes.get(id);
            if (node) {
              const defStartPos = document.positionAt(node.position + 1); // +1 to skip opening quote
              const defEndPos = document.positionAt(node.position + id.length + 1);
              const defRange = new vscode.Range(defStartPos, defEndPos);

              // Add a clickable link to go to definition
              content.appendMarkdown(
                `\n\n[Go to definition](${commandUri}) — or hold Ctrl and click the identifier.`
              );

              // Register a one-time command handler for this hover
              const disposable = vscode.commands.registerCommand(
                'workbench.action.navigateBack',
                () => {
                  // Navigate to the definition
                  vscode.window.showTextDocument(document, {
                    selection: defRange,
                    preserveFocus: false,
                  });
                  // Dispose the command handler after use
                  disposable.dispose();
                }
              );

              // Make sure to dispose the command handler when the hover is dismissed
              setTimeout(() => disposable.dispose(), 1000);
            }

            return new vscode.Hover(content, range);
          }
        }
      }

      return null;
    },
  };
}

/**
 * Creates a definition provider for IFCX identifiers
 */
function createDefinitionProvider(): vscode.DefinitionProvider {
  return {
    provideDefinition: (document, position) => {
      // Get the identifier cache for this document
      const nodes = getIdentifierCache().get(document.uri.toString());
      const positions = getIdentifierPositionsCache().get(document.uri.toString());

      if (!nodes || !positions) return null;

      // Check if the position is within any identifier range
      for (const [id, ranges] of positions.entries()) {
        for (const range of ranges) {
          if (range.contains(position)) {
            // Find the definition range (the first occurrence in the identifier attribute)
            const node = nodes.get(id);
            if (node) {
              const defStartPos = document.positionAt(node.position + 1); // +1 to skip opening quote
              const defEndPos = document.positionAt(node.position + id.length + 1);
              return new vscode.Location(document.uri, new vscode.Range(defStartPos, defEndPos));
            }
          }
        }
      }

      return null;
    },
  };
}

/**
 * Activates the identifier definitions feature
 */
export function activateIdentifierDefinitions(context: vscode.ExtensionContext) {
  // Register the hover provider for IFCX files
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: 'file', language: 'ifcx' },
      createHoverProvider()
    )
  );

  // Register the definition provider for IFCX files
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { scheme: 'file', language: 'ifcx' },
      createDefinitionProvider()
    )
  );
}
