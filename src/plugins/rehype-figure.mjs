import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

export function rehypeFigure() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent) return;
      if (node.children.length !== 1) return;

      const child = node.children[0];
      if (child.type !== 'element' || child.tagName !== 'img') return;

      child.properties = child.properties || {};
      child.properties.className = (child.properties.className || []).concat('responsive-img');
      child.properties.decoding = 'async';

      const children = [child];
      if (child.properties.title) {
        children.push(h('figcaption', child.properties.title));
      }

      parent.children[index] = h('figure', children);
    });
  };
}
