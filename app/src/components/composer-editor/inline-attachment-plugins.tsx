import React from 'react';
import { ImageAttachmentItem } from 'mailspring-component-kit';
import { AttachmentStore } from 'mailspring-exports';
import { isQuoteNode } from './base-block-plugins';
import { ComposerEditorPlugin } from './types';

const IMAGE_TYPE = 'image';

function ImageNode(props) {
  const { attributes, node, editor, targetIsHTML, isSelected } = props;
  const contentId = node.data.get ? node.data.get('contentId') : node.data.contentId;

  if (targetIsHTML) {
    return <img alt="" src={`cid:${contentId}`} />;
  }

  const { draft } = editor.props.propsForPlugins;
  const file = draft.files.find(f => contentId === f.contentId);
  if (!file) {
    return <span />;
  }

  return (
    <ImageAttachmentItem
      {...attributes}
      draggable={false}
      className={`file-upload ${isSelected && 'custom-block-selected'}`}
      filePath={AttachmentStore.pathForFile(file)}
      displayName={file.filename}
      onRemoveAttachment={() => editor.removeNodeByKey(node.key)}
    />
  );
}

function renderNode(props, editor = null, next = () => {}) {
  if (props.node.type === IMAGE_TYPE) {
    return ImageNode(props);
  }
  return next();
}

const rules = [
  {
    deserialize(el, next) {
      if (el.tagName.toLowerCase() === 'img' && (el.getAttribute('src') || '').startsWith('cid:')) {
        return {
          object: 'inline',
          nodes: [],
          type: IMAGE_TYPE,
          data: {
            contentId: el
              .getAttribute('src')
              .split('cid:')
              .pop(),
          },
        };
      }
    },
    serialize(obj, children) {
      if (obj.object !== 'inline') return;
      return renderNode({ node: obj, children, targetIsHTML: true });
    },
  },
];

export const changes = {
  insert: (editor: Editor, file) => {
    const canHoldInline = node => !node.isVoid && !isQuoteNode(node) && !!node.getFirstText();

    while (!canHoldInline(editor.value.anchorBlock)) {
      editor.moveToEndOfPreviousText();
      if (!editor.value.anchorBlock) {
        break;
      }
    }
    return editor.insertInline({
      object: 'inline',
      type: IMAGE_TYPE,
      data: {
        contentId: file.contentId,
      },
    });
  },
};

const plugins: ComposerEditorPlugin[] = [
  {
    renderNode,
    rules,
  },
];

export default plugins;
