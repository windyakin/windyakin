import { defineHastPlugin } from 'satteri';

export const figure = defineHastPlugin({
  name: 'figure',
  element: {
    filter: ['p'],
    visit(node, ctx) {
      if (node.children.length !== 1) return;

      const child = node.children[0];
      if (child.type !== 'element') return;

      let img;
      if (child.tagName === 'img') {
        img = child;
      } else if (
        child.tagName === 'a' &&
        child.children?.length === 1 &&
        child.children[0]?.type === 'element' &&
        child.children[0]?.tagName === 'img'
      ) {
        img = child.children[0];
      } else {
        return;
      }

      const figChildren = [child];
      if (img.properties?.title) {
        figChildren.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: img.properties.title }],
        });
      }

      ctx.replaceNode(node, {
        type: 'element',
        tagName: 'figure',
        properties: {},
        children: figChildren,
      });
    },
  },
});
