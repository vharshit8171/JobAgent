import type { BaseMessage } from '@langchain/core/messages';

/** Message content can be a string or a list of blocks. Always get plain text. */
export function contentToString(content: BaseMessage['content']): string {
  if (typeof content === 'string') return content;
  return content
    .map((part) => ('text' in part && typeof part.text === 'string' ? part.text : ''))
    .join('');
}