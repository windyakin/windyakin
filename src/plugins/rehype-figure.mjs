import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

export function rehypeFigure() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent) return;
      if (node.children.length !== 1) return;

      const child = node.children[0];
      if (child.type !== 'element') return;

      let img;
      if (child.tagName === 'img') {
        img = child;
      } else if (
        child.tagName === 'a' &&
        child.children.length === 1 &&
        child.children[0].type === 'element' &&
        child.children[0].tagName === 'img'
      ) {
        img = child.children[0];
      } else {
        return;
      }

      img.properties = img.properties || {};
      img.properties.className = (img.properties.className || []).concat('responsive-img');
      img.properties.decoding = 'async';

      const children = [child];
      if (img.properties.title) {
        children.push(h('figcaption', img.properties.title));
      }

      parent.children[index] = h('figure', children);
    });
  };
}
