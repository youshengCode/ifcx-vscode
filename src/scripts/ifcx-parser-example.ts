import * as path from 'path';
import {
  parseIfcxFile,
  findNodeByIdentifier,
  getChildNodes,
  getInheritingNodes,
} from '../utils/ifcx-parser';

/**
 * Example script demonstrating how to use the IFCX parser
 */
function main() {
  try {
    // Path to an IFCX file (replace with your actual file path)
    const ifcxFilePath = path.resolve(
      __dirname,
      '../../reference/ifc5-sample-files/hello-wall.ifcx'
    );

    console.log(`Parsing IFCX file: ${ifcxFilePath}`);

    // Parse the IFCX file
    const ifcxFile = parseIfcxFile(ifcxFilePath);

    // Display basic information about the file
    console.log('\nFile Information:');
    console.log(`Version: ${ifcxFile.header.version}`);
    console.log(`Author: ${ifcxFile.header.author}`);
    console.log(`Timestamp: ${ifcxFile.header.timestamp}`);
    console.log(`Number of schemas: ${Object.keys(ifcxFile.schemas).length}`);
    console.log(`Number of nodes: ${ifcxFile.data.length}`);

    // Example: Find a specific node by identifier
    const nodeIdentifier = ifcxFile.data[0]?.identifier;
    if (nodeIdentifier) {
      console.log(`\nFinding node with identifier: ${nodeIdentifier}`);
      const node = findNodeByIdentifier(ifcxFile, nodeIdentifier);

      if (node) {
        console.log('Node found:');
        console.log(`  Identifier: ${node.identifier}`);
        console.log(`  Has children: ${node.children ? 'Yes' : 'No'}`);
        console.log(`  Has inherits: ${node.inherits ? 'Yes' : 'No'}`);
        console.log(`  Has attributes: ${node.attributes ? 'Yes' : 'No'}`);

        // If the node has children, display them
        if (node.children) {
          console.log('\nChild nodes:');
          const childNodes = getChildNodes(ifcxFile, nodeIdentifier);

          childNodes.forEach((child, index) => {
            console.log(`  ${index + 1}. ${child.identifier}`);
          });
        }

        // If the node has inherits, display them
        if (node.inherits) {
          console.log('\nInheriting nodes:');
          const inheritingNodes = getInheritingNodes(ifcxFile, nodeIdentifier);

          inheritingNodes.forEach((inheritingNode, index) => {
            console.log(`  ${index + 1}. ${inheritingNode.identifier}`);
          });
        }
      } else {
        console.log('Node not found');
      }
    }

    console.log('\nParsing completed successfully');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  main();
}
