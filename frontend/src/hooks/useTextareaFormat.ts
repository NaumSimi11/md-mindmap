import { RefObject } from 'react';

/**
 * useTextarea Format - Universal textarea formatting hook
 * Eliminates ~500 lines of duplicate mobile/desktop formatting code
 */
export const useTextareaFormat = (textareaRef: RefObject<HTMLTextAreaElement>) => {
    const insertFormat = (startTag: string, endTag: string, setter: (content: string) => void, content: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);

        const newText = before + startTag + selectedText + endTag + after;
        setter(newText);

        setTimeout(() => {
            const newCursorPos = start + startTag.length + selectedText.length + endTag.length;
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertHeading = (headingTag: string, setter: (content: string) => void, content: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(start);

        const lineStart = before.lastIndexOf('\n') + 1;
        const beforeLine = before.substring(0, lineStart);
        const currentLine = before.substring(lineStart);

        const newText = beforeLine + headingTag + currentLine + after;
        setter(newText);

        setTimeout(() => {
            const newCursorPos = start + headingTag.length;
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertList = (listTag: string, setter: (content: string) => void, content: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(start);

        const lineStart = before.lastIndexOf('\n') + 1;
        const beforeLine = before.substring(0, lineStart);
        const currentLine = before.substring(lineStart);

        const newText = beforeLine + listTag + currentLine + after;
        setter(newText);

        setTimeout(() => {
            const newCursorPos = start + listTag.length;
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertLink = (setter: (content: string) => void, content: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        const linkText = selectedText || 'Link Text';
        const linkFormat = `[${linkText}](URL)`;

        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);

        const newText = before + linkFormat + after;
        setter(newText);

        setTimeout(() => {
            const urlStart = start + linkText.length + 3;
            const urlEnd = urlStart + 3;
            textarea.focus();
            textarea.setSelectionRange(urlStart, urlEnd);
        }, 0);
    };

    const insertImage = (setter: (content: string) => void, content: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        const altText = selectedText || 'Alt text';
        const imageFormat = `![${altText}](image-url)`;

        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);

        const newText = before + imageFormat + after;
        setter(newText);

        setTimeout(() => {
            const urlStart = start + altText.length + 4;
            const urlEnd = urlStart + 9;
            textarea.focus();
            textarea.setSelectionRange(urlStart, urlEnd);
        }, 0);
    };

    const insertCode = (setter: (content: string) => void, content: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        if (selectedText.includes('\n')) {
            insertFormat('```\n', '\n```', setter, content);
        } else {
            insertFormat('`', '`', setter, content);
        }
    };

    return {
        insertFormat,
        insertHeading,
        insertList,
        insertLink,
        insertImage,
        insertCode,
    };
};
