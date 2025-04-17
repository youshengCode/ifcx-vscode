import * as fs from 'fs';
import * as path from 'path';
import { extractIdentifierGraph, generateIdentifierReport } from '../utils/identifier-extractor';

/**
 * Test the identifier extractor utility
 */
describe('Identifier Extractor Tests', () => {
  // Read the hello-wall.ifcx file for testing
  const filePath = path.join(__dirname, '../../reference/ifc5-sample-files/hello-wall.ifcx');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  describe('extractIdentifierGraph', () => {
    it('should extract identifiers and relationships from IFCX content', () => {
      const nodes = extractIdentifierGraph(fileContent);

      // Check nodes extraction
      expect(nodes).toBeDefined();
      expect(nodes.size).toBeGreaterThan(0);

      // Check node properties
      const rootNode = nodes.get('1ea5c0ac-b13b-4ead-aa94-26d4dd36823e');
      expect(rootNode).toBeDefined();
      expect(rootNode?.children).toContain('08aa04b9-4ca7-45e0-9549-9154fef2828b');

      // Check that child nodes have names extracted from the children object
      const projectNode = nodes.get('08aa04b9-4ca7-45e0-9549-9154fef2828b');
      expect(projectNode).toBeDefined();
      expect(projectNode?.name).toBe('My_Project');

      const siteNode = nodes.get('8adf3b8f-f34a-4687-a406-5063ee095a1a');
      expect(siteNode).toBeDefined();
      expect(siteNode?.name).toBe('My_Site');

      // Check that nodes have inherits extracted from the inherits object
      const windowNode = nodes.get('82966dcf-41fc-4776-97f1-71d9cb52ab7e');
      expect(windowNode).toBeDefined();
      console.log('Window node:', windowNode); // Add debug logging
      expect(windowNode?.name).toBe('Window');
      expect(windowNode?.inherits).toContain('f40ec978-42e6-414a-a044-b6df23dfafef');

      const windowNode2 = nodes.get('8134f9ec-2e87-4b70-a538-9b6dc7ba94b1');
      expect(windowNode2).toBeDefined();
      expect(windowNode2?.name).toBe('Window_001');
      expect(windowNode2?.inherits).toContain('f40ec978-42e6-414a-a044-b6df23dfafef');

      // Check that nodes have the correct property names
      const firstNode = Array.from(nodes.values())[0];
      expect(firstNode).toHaveProperty('identifier');
      expect(firstNode).toHaveProperty('children');
      expect(firstNode).toHaveProperty('position');

      // Optional properties may not exist on all nodes
      if ('name' in firstNode) {
        expect(firstNode).toHaveProperty('name');
      }
      if ('inherits' in firstNode) {
        expect(firstNode).toHaveProperty('inherits');
      }
      if ('parent' in firstNode) {
        expect(firstNode).toHaveProperty('parent');
      }
    });
  });

  describe('generateIdentifierReport', () => {
    it('should generate a JSON report of the identifier graph', () => {
      const nodes = extractIdentifierGraph(fileContent);
      const report = generateIdentifierReport(nodes);

      // Parse the JSON report
      const reportData = JSON.parse(report);

      // Check the structure of the report
      expect(reportData).toHaveProperty('summary');
      expect(reportData.summary).toHaveProperty('totalNodes');

      expect(reportData).toHaveProperty('nodes');
      expect(Array.isArray(reportData.nodes)).toBe(true);

      // Check that each node has the expected properties
      reportData.nodes.forEach((node: any) => {
        expect(node).toHaveProperty('identifier');
        expect(node).toHaveProperty('children');
      });

      // Write the report to a file for inspection
      const outputDir = path.join(__dirname, '../../generated');

      // Create the directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(path.join(outputDir, 'identifier-report.json'), report);
    });
  });
});
