import { describe, expect, test, beforeEach } from "@jest/globals";

import { Block, create, refleshBlockFromPageUpdate } from "./block";
import { Text, PropertyPair, Marker } from "./token";

describe("Block", () => {
  let block: Block;

  beforeEach(() => {
    block = new Block([], 1, []);
  });

  describe("constructor", () => {
    test("default values", () => {
      expect(block).toBeInstanceOf(Block);
      expect(block.content).toEqual([]);
      expect(block.depth).toBe(1);
      expect(block.children).toEqual([]);
    });
  });

  describe("withXXX updates its field", () => {
    test("withId", () => {
      block.withId("test-id");
      expect(block.id).toBe("test-id");
    });

    test("withParent", () => {
      const parentBlock = new Block([], 1, []);
      block.withParent(parentBlock);
      expect(block.parent).toBe(parentBlock);
    });
  });

  describe("getNext", () => {
    test("when it has children, returns the first child", () => {
      const block = new Block([], 1, []);
      const childBlock = new Block([], 2, []);
      block.children.push(childBlock);
      expect(block.getNext()).toBe(childBlock);
    });

    test("when it has no children, returns the next sibling", () => {
      const parent = new Block([], 1, []);
      const child1 = new Block([], 2, []).withParent(parent);
      const grandchild = new Block([], 3, []).withParent(child1);
      const child2 = new Block([], 2, []).withParent(parent);
      child1.children.push(grandchild);
      parent.children.push(child1);
      parent.children.push(child2);
      expect(parent.children).toHaveLength(2);
      expect(grandchild.getNext()).toBe(child2);
    });

    test("when the parent has empty children (invalid), it returns null", () => {
      const parent = new Block([], 1, []);
      const child = new Block([], 2, []).withParent(parent);
      expect(child.getNext()).toBeNull();
    });

    test("when it does not have parent (invalid input), it returns null", () => {
      const block = new Block([], 1, []);
      expect(block.getNext()).toBeNull();
    });
  });

  describe("getPrevious", () => {
    test("when it has no parent, returns null", () => {
      const block = new Block([], 1, []);
      expect(block.getPrevious()).toBeUndefined();
    });

    test("when it is the first child, returns its parent", () => {
      const parent = new Block([], 1, []);
      const child = new Block([], 2, []);
      parent.children.push(child);
      child.withParent(parent);
      expect(child.getPrevious()).toBe(parent);
    });

    test("when it is not the first child, returns the previous sibling", () => {
      const parent = new Block([], 1, []).withId("1");
      const child1 = new Block([], 2, []).withId("1-1");
      child1.withParent(parent);
      const child2 = new Block([], 2, []).withId("1-2");
      child2.withParent(parent);
      parent.children = [child1, child2];
      expect(child2.getPrevious()?.id).toBe("1-1");
    });
  });

  describe("getProperties", () => {
    test("when properties does not exist, it returns undefined", () => {
      expect(block.getProperty("key")).toBeUndefined();
    });
    test("when exists, it returns properties", () => {
      block.withProperties([["key", "value"]]);
      expect(block.getProperty("key")).toEqual("value");
    });
    test("when key does not exist, it returns undefined", () => {
      block.withProperties([["key", "value"]]);
      expect(block.getProperty("key2")).toBeUndefined();
    });
  });

  describe("getLastDescendant", () => {
    test("when it has no children, returns itself", () => {
      const block = new Block([], 1, []);
      expect(block.getLastDescendant()).toBe(block);
    });
    test("when it has children, returns the last child", () => {
      const block = new Block([], 1, []);
      const childBlock = new Block([], 2, []);
      block.children.push(childBlock);
      expect(block.getLastDescendant()).toBe(childBlock);
    });
  });

  describe("getLastChild", () => {
    test("when it has no children, returns undefined", () => {
      const block = new Block([], 1, []);
      expect(block.getLastChild()).toBeUndefined();
    });
    test("when it has children, returns the last child", () => {
      const block = new Block([], 1, []);
      const childBlock = new Block([], 2, []);
      block.children.push(childBlock);
      expect(block.getLastChild()).toBe(childBlock);
    });
  });

  describe("getBlockById", () => {
    test("when the id matches, returns itself", () => {
      const block = new Block([], 1, []);
      block.withId("test-id");
      expect(block.getBlockById("test-id")).toBe(block);
    });
    test("when the child id matches, returns the child", () => {
      const block = new Block([], 1, []);
      const childBlock = new Block([], 2, []);
      childBlock.withId("test-id");
      block.children.push(childBlock);
      expect(block.getBlockById("test-id")).toBe(childBlock);
    });
    test("when it has no children, returns null", () => {
      const block = new Block([], 1, []);
      expect(block.getBlockById("test-id")).toBeNull();
    });
  });

  describe("toJSON", () => {
    test("returns a JSON representation of the block", () => {
      const block = new Block([], 1, []);
      block.withId("test-id");
      block.withProperties([["key", "value"]]);
      expect(block.toJSON()).toEqual({
        content: [],
        contentMarkdown: undefined,
        depth: 1,
        children: [],
        id: "test-id",
        properties: [["key", "value"]],
        page: undefined,
        parentId: undefined,
        backlinks: undefined,
        marker: undefined,
      });
    });

    test("with children", () => {
      const block = new Block([], 1, [new Block([], 2, []).withId("child-id")]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = block.toJSON();
      expect(json.children).toHaveLength(1);
    });
  });

  describe("create", () => {
    test("returns a new Block instance", () => {
      const block = new Block([], 1, []);
      const newBlock = create(block);
      expect(newBlock).toBeInstanceOf(Block);
      expect(newBlock.content).toEqual(block.content);
      expect(newBlock.depth).toEqual(block.depth);
      expect(newBlock.children).toEqual(block.children);
    });
    test("with children", () => {
      const childBlock = new Block([], 1, []);
      const parentBlock = new Block([], 1, [childBlock]);
      const newParentBlock = create(parentBlock);
      expect(newParentBlock.children).toHaveLength(1);
      expect(newParentBlock.children[0]).toBeInstanceOf(Block);
    });
    test("with properties", () => {
      const block = new Block(
        [new PropertyPair(new Text("key"), [new Text(" value")])],
        1,
        [],
      );
      block.contentMarkdown = "key:: value";
      block.withProperties([["key", "value"]]);
      const newBlock = create(block);
      expect(newBlock.getProperty("key")).toBe("value");
    });
    test("with marker", () => {
      const block = new Block([new Marker("DOING")], 1, []);
      const newBlock = create(block);
      expect(newBlock.getProperty("status")).toBe("DOING");
    });
  });

  describe("increaseLevel", () => {
    test("when it has no parent, it does nothing", () => {
      const block = new Block([], 1, []);
      block.increaseLevel();
      expect(block.depth).toBe(1);
    });

    test("when it has a parent but it is the first child, it does nothing", () => {
      const parent = new Block([], 1, []);
      const child = new Block([], 2, []);
      child.withParent(parent);
      parent.children.push(child);
      child.increaseLevel();
      expect(child.depth).toBe(2);
    });

    test("increases the depth of the block", () => {
      const child1 = new Block([], 2, []).withId("child1");
      const child2 = new Block([], 2, []).withId("child2");
      const parent = new Block([], 1, [child1, child2]).withId("parent");
      child1.withParent(parent);
      child2.withParent(parent);
      const root = new Block([], 0, [parent]);
      parent.withParent(root);

      child2.increaseLevel();
      console.log(root);
      expect(root.children[0].id).toBe("parent");
    });
  });

  describe("decreaseLevel", () => {
    test("when it has no parent, it does nothing", () => {
      const block = new Block([], 1, []);
      block.decreaseLevel();
      expect(block.depth).toBe(1);
    });

    test("when it has no grandparent, it does nothing", () => {
      const block = new Block([], 1, []);
      const parent = new Block([], 0, [block]);
      block.withParent(parent);

      block.decreaseLevel();
      expect(parent.depth).toBe(0);
      expect(block.depth).toBe(1);
    });

    test("decreases the depth of the block", () => {
      const child1 = new Block([], 2, []).withId("child1");
      const child2 = new Block([], 2, []).withId("child2");
      const parent = new Block([], 1, [child1, child2]).withId("parent");
      child1.withParent(parent);
      child2.withParent(parent);
      const root = new Block([], 0, [parent]);
      parent.withParent(root);

      child2.decreaseLevel();
      expect(root.children[0].id).toBe("parent");
    });

    test("decreases the block with children", () => {
      const grandchild = new Block([], 3, []).withId("0-0-0-0");
      const child1 = new Block([], 2, [grandchild]).withId("0-0-0");
      grandchild.withParent(child1);

      const parent1 = new Block([], 1, [child1]).withId("0-0");
      child1.withParent(parent1);

      const parent2 = new Block([], 1, []).withId("0-1");
      const root = new Block([], 0, [parent1, parent2]);
      parent1.withParent(root);
      parent2.withParent(root);

      child1.decreaseLevel();

      expect(root.children[0].id).toBe("0-0");
      expect(root.children[1].id).toBe("0-0-0");
      expect(root.children[2].id).toBe("0-1");
    });
  });

  describe("hasChildren", () => {
    test("when it has no children, returns false", () => {
      const block = new Block([], 1, []);
      expect(block.hasChildren()).toBe(false);
    });

    test("when it has children, returns true", () => {
      const block = new Block([], 1, [new Block([], 2, [])]);
      expect(block.hasChildren()).toBe(true);
    });
  });

  describe("flatten", () => {
    test("when it has no children, returns itself", () => {
      const block = new Block([], 1, []);
      expect(block.flatten()).toEqual([block]);
    });
    test("when it has children, returns itself and its children", () => {
      const childBlock = new Block([], 2, []);
      const block = new Block([], 1, [childBlock]);
      expect(block.flatten()).toEqual([block, childBlock]);
    });
  });

  describe("refleshBlockFromPageUpdate", () => {
    test("when it has no content, returns an empty string", () => {
      const block = new Block([], 1, []);
      block.contentMarkdown = undefined;

      refleshBlockFromPageUpdate(block);
      expect(block.content).toStrictEqual([]);
    });
    test("when it has content, returns an empty string", () => {
      const block = new Block([], 1, []);
      block.contentMarkdown = "test";

      refleshBlockFromPageUpdate(block);
      expect(block.content).toStrictEqual([new Text("test")]);
    });
  });
});
