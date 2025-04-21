import { parseIfcxContent } from './ifcx-parser';

/**
 * Represents a node in the IFCX document with its identifier and relationships
 */
export interface IfcxNodeInfo {
  identifier: string;
  name?: string;
  inherits?: string[];
  position: number;
  parent?: string;
  children: string[];
  childrenNames: Map<string, string>;
}

/**
 * Extracts identifiers and their relationships from an IFCX document
 * @param content The IFCX document content
 * @returns A map of node identifiers to node information
 */
export function extractIdentifierGraph(content: string): Map<string, IfcxNodeInfo> {
  const nodes = new Map<string, IfcxNodeInfo>();

  // First pass: collect all nodes with their identifiers
  const parsed = parseIfcxContent(content);
  if (!parsed || !parsed.data) {
    return nodes;
  }

  // Process each node in the data array
  parsed.data.forEach((node: any, index: number) => {
    if (!node.identifier) return;

    // Check if the node already exists
    let nodeInfo = nodes.get(node.identifier);
    if (!nodeInfo) {
      nodeInfo = {
        identifier: node.identifier,
        position: content.indexOf(`"identifier":"${node.identifier}"`),
        children: [],
        childrenNames: new Map<string, string>(),
      };
      nodes.set(node.identifier, nodeInfo);
    }

    // Extract inherits from the inherits object if available
    if (node.inherits) {
      // Check if inherits is an object with key-value pairs
      if (typeof node.inherits === 'object') {
        // Get all values from the inherits object
        const inheritValues = Object.values(node.inherits);
        console.log(`Processing inherits for node ${node.identifier}:`, node.inherits);
        if (inheritValues.length > 0) {
          // Convert all values to strings and filter out non-string values
          nodeInfo.inherits = inheritValues
            .filter((value: unknown) => typeof value === 'string')
            .map((value: unknown) => value as string);
          console.log(`Node ${node.identifier} inherits from ${nodeInfo.inherits?.join(', ')}`);
        }
      } else if (Array.isArray(node.inherits)) {
        // Handle array inheritance (e.g., for schema definitions)
        nodeInfo.inherits = node.inherits.filter((value: unknown) => typeof value === 'string');
        console.log(
          `Node ${node.identifier} inherits from ${nodeInfo.inherits?.join(', ')} (array)`
        );
      }
    }
  });

  // Second pass: establish relationships and extract names from children
  parsed.data.forEach((node: any) => {
    if (!node.identifier) return;
    const nodeInfo = nodes.get(node.identifier);
    if (!nodeInfo) return;

    // Process children and extract names
    if (node.children) {
      Object.entries(node.children).forEach(([childName, childId]) => {
        if (typeof childId === 'string') {
          nodeInfo.children.push(childId);
          nodeInfo.childrenNames.set(childId, childName);

          // Set the name of the child node based on the key in the children object
          const childInfo = nodes.get(childId);
          if (childInfo) {
            childInfo.name = childName;
            childInfo.parent = node.identifier;
          }
        }
      });
    }
  });

  return nodes;
}

/**
 * Generates a JSON report of the identifier graph
 * @param nodes The map of node identifiers to node information
 * @returns A JSON string containing the report
 */
export function generateIdentifierReport(nodes: Map<string, IfcxNodeInfo>): string {
  // Create a structured JSON object
  const reportData = {
    summary: {
      totalNodes: nodes.size,
    },
    nodes: Array.from(nodes.values()),
  };

  // Convert to JSON with proper formatting
  return JSON.stringify(reportData, null, 2);
}

/**
 * Generates an informative tooltip in Markdown format for a given identifier
 * @param identifier The identifier to generate a tooltip for
 * @param nodes The map of node identifiers to node information
 * @returns A formatted Markdown string containing information about the node
 */
export function generateTooltipForIdentifier(
  identifier: string,
  nodes: Map<string, IfcxNodeInfo>
): string {
  const node = nodes.get(identifier);
  if (!node) {
    return `**Unknown Identifier**: ${identifier}`;
  }

  let tooltip = `### ${node.name || 'Unnamed Node'}\n\n`;
  tooltip += `**Identifier**: \`${node.identifier}\`\n\n`;

  if (node.inherits && node.inherits.length > 0) {
    tooltip += `**Inherits from**:\n`;
    node.inherits.forEach((inheritId) => {
      const inheritNode = nodes.get(inheritId);
      tooltip += `- \`${inheritId}\`${inheritNode?.name ? ` (${inheritNode.name})` : ''}\n`;
    });
    tooltip += '\n';
  }

  if (node.parent) {
    const parentNode = nodes.get(node.parent);
    tooltip += `**Parent**: \`${node.parent}\`${parentNode?.name ? ` (${parentNode.name})` : ''}\n\n`;
  }

  if (node.children && node.children.length > 0) {
    tooltip += `**Children** (${node.children.length}):\n`;
    node.children.forEach((childId) => {
      const childName = node.childrenNames.get(childId);
      tooltip += `- \`${childId}\` (${childName || 'Unnamed'})\n`;
    });
  }

  return tooltip;
}
