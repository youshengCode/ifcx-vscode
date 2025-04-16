import * as path from 'path';
import {
  parseIfcxFile,
  findNodeByIdentifier,
  getChildNodes,
  getInheritingNodes,
} from '../utils/ifcx-parser';
import { components } from '../../reference/ifc5-development/schema/out/ts/ifcx';

type IfcxFile = components['schemas']['IfcxFile'];

describe('IFCX Parser', () => {
  let ifcxFile: IfcxFile;
  const sampleFilePath = path.resolve(
    __dirname,
    '../../reference/ifc5-sample-files/hello-wall.ifcx'
  );

  beforeAll(() => {
    ifcxFile = parseIfcxFile(sampleFilePath);
  });

  describe('File Parsing', () => {
    it('should parse IFCX file successfully', () => {
      expect(ifcxFile).toBeDefined();
      expect(ifcxFile.header).toBeDefined();
      expect(ifcxFile.schemas).toBeDefined();
      expect(ifcxFile.data).toBeDefined();
    });

    it('should contain correct header information', () => {
      expect(ifcxFile.header.version).toBe('ifcx_alpha');
      expect(ifcxFile.header.author).toBeDefined();
      expect(ifcxFile.header.timestamp).toBeDefined();
    });

    it('should contain schemas and data', () => {
      expect(Object.keys(ifcxFile.schemas).length).toBeGreaterThan(0);
      expect(ifcxFile.data.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid file path', () => {
      expect(() => parseIfcxFile('non-existent-file.ifcx')).toThrow();
    });
  });

  describe('Node Operations', () => {
    it('should find node by identifier', () => {
      const nodeIdentifier = ifcxFile.data[0]?.identifier;
      expect(nodeIdentifier).toBeDefined();

      const node = findNodeByIdentifier(ifcxFile, nodeIdentifier!);
      expect(node).toBeDefined();
      expect(node?.identifier).toBe(nodeIdentifier);
    });

    it('should return undefined for non-existent node identifier', () => {
      const node = findNodeByIdentifier(ifcxFile, 'non-existent-id');
      expect(node).toBeUndefined();
    });

    it('should get child nodes', () => {
      // Find a node that has children
      const parentNode = ifcxFile.data.find(
        (node) => node.children && Object.keys(node.children).length > 0
      );
      expect(parentNode).toBeDefined();

      if (parentNode) {
        const childNodes = getChildNodes(ifcxFile, parentNode.identifier);
        expect(childNodes.length).toBeGreaterThan(0);

        // Verify each child node exists
        childNodes.forEach((child) => {
          expect(child).toBeDefined();
          expect(child.identifier).toBeDefined();
        });
      }
    });

    it('should return empty array for node without children', () => {
      // Find a node without children
      const nodeWithoutChildren = ifcxFile.data.find((node) => !node.children);
      expect(nodeWithoutChildren).toBeDefined();

      if (nodeWithoutChildren) {
        const childNodes = getChildNodes(ifcxFile, nodeWithoutChildren.identifier);
        expect(childNodes).toEqual([]);
      }
    });

    it('should get inheriting nodes', () => {
      // Find a node that has inheritors
      const baseNode = ifcxFile.data.find((node) => {
        return ifcxFile.data.some(
          (otherNode) =>
            otherNode.inherits && Object.values(otherNode.inherits).includes(node.identifier)
        );
      });
      expect(baseNode).toBeDefined();

      if (baseNode) {
        const inheritingNodes = getInheritingNodes(ifcxFile, baseNode.identifier);
        expect(inheritingNodes.length).toBeGreaterThan(0);

        // Verify each inheriting node has the correct inheritance
        inheritingNodes.forEach((node) => {
          expect(node.inherits).toBeDefined();
          expect(Object.values(node.inherits!).includes(baseNode.identifier)).toBe(true);
        });
      }
    });

    it('should return empty array for node without inheritors', () => {
      // Find a node that has no inheritors
      const nodeWithoutInheritors = ifcxFile.data.find((node) => {
        return !ifcxFile.data.some(
          (otherNode) =>
            otherNode.inherits && Object.values(otherNode.inherits).includes(node.identifier)
        );
      });
      expect(nodeWithoutInheritors).toBeDefined();

      if (nodeWithoutInheritors) {
        const inheritingNodes = getInheritingNodes(ifcxFile, nodeWithoutInheritors.identifier);
        expect(inheritingNodes).toEqual([]);
      }
    });
  });
});
