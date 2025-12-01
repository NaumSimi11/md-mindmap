import { ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from './FontSizeExtension';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';
import { MermaidNode } from './MermaidNode';
import { CalloutNode } from './CalloutNode';
import { YouTubeNode } from './YouTubeNode';
import { VimeoNode } from './VimeoNode';
import { PDFNode } from './PDFNode';
import { GistNode } from './GistNode';
import { EnhancedBlockquote } from './EnhancedBlockquote';
import { FootnoteReference, FootnoteDefinition, FootnotesSection } from './FootnoteExtension';
import { TOCNode } from './TOCNode';
import { ResizableImageNodeView } from './ResizableImageNodeView';
import { SlashCommandExtension, slashCommandSuggestion } from '../SlashCommandExtension';
import { GhostTextExtension } from './GhostTextExtension';
import { AIAutocompleteExtension } from './AIAutocompleteExtension';
import { getAIAutocompleteSuggestion } from './aiAutocomplete';
import { getMockAISuggestion } from './ghostText';

interface GetExtensionsProps {
    setShowDiagramMenu: (show: boolean) => void;
    setShowAIModal: (show: boolean) => void;
    setShowTableModal: (show: boolean) => void;
    aiHintsEnabledRef: React.MutableRefObject<{ enabled: boolean }>;
    aiAutocompleteEnabled: boolean;
}

export const getExtensions = ({
    setShowDiagramMenu,
    setShowAIModal,
    setShowTableModal,
    aiHintsEnabledRef,
    aiAutocompleteEnabled
}: GetExtensionsProps) => {
    return [
        StarterKit.configure({
            heading: { levels: [1, 2, 3, 4, 5, 6] },
            link: false,
            blockquote: false, // Use our EnhancedBlockquote instead
        }),
        Placeholder.configure({
            placeholder: 'Start writing your document... Type "/" for commands',
        }),
        TextStyle,
        FontFamily.configure({
            types: ['textStyle'],
        }),
        FontSize.configure({
            types: ['textStyle'],
        }),
        Table.configure({
            resizable: true,
        }),
        TableRow,
        // 🔥 Configure TableCell to support text alignment
        TableCell.extend({
            addAttributes() {
                return {
                    ...this.parent?.(),
                    textAlign: {
                        default: null,
                        parseHTML: element => element.getAttribute('data-align') || element.style.textAlign || null,
                        renderHTML: attributes => {
                            if (!attributes.textAlign) {
                                return {};
                            }
                            return {
                                'data-align': attributes.textAlign,
                                style: `text-align: ${attributes.textAlign}`,
                            };
                        },
                    },
                };
            },
        }),
        // 🔥 Configure TableHeader to support text alignment
        TableHeader.extend({
            addAttributes() {
                return {
                    ...this.parent?.(),
                    textAlign: {
                        default: null,
                        parseHTML: element => element.getAttribute('data-align') || element.style.textAlign || null,
                        renderHTML: attributes => {
                            if (!attributes.textAlign) {
                                return {};
                            }
                            return {
                                'data-align': attributes.textAlign,
                                style: `text-align: ${attributes.textAlign}`,
                            };
                        },
                    },
                };
            },
        }),
        TaskList,
        TaskItem.configure({
            nested: true,
        }),
        // 🖼️ Enhanced Images - drag/drop, paste, captions, alignment, RESIZE
        Image.extend({
            addAttributes() {
                return {
                    ...this.parent?.(),
                    width: {
                        default: null,
                        parseHTML: element => element.getAttribute('width'),
                        renderHTML: attributes => {
                            if (!attributes.width) return {};
                            return { width: attributes.width };
                        },
                    },
                    height: {
                        default: null,
                        parseHTML: element => element.getAttribute('height'),
                        renderHTML: attributes => {
                            if (!attributes.height) return {};
                            return { height: attributes.height };
                        },
                    },
                    caption: {
                        default: null,
                        parseHTML: element => element.getAttribute('data-caption'),
                        renderHTML: attributes => {
                            if (!attributes.caption) return {};
                            return { 'data-caption': attributes.caption };
                        },
                    },
                    align: {
                        default: 'center',
                        parseHTML: element => element.getAttribute('data-align') || 'center',
                        renderHTML: attributes => {
                            return { 'data-align': attributes.align || 'center' };
                        },
                    },
                };
            },
            addNodeView() {
                return ReactNodeViewRenderer(ResizableImageNodeView);
            },
            addProseMirrorPlugins() {
                return [
                    ...(this.parent?.() || []),
                ];
            },
        }).configure({
            inline: false,
            allowBase64: true,
            HTMLAttributes: {
                class: 'editor-image',
            },
        }),
        Link.configure({
            openOnClick: false, // Will open with Cmd/Ctrl+Click instead
            HTMLAttributes: {
                class: 'text-primary underline cursor-pointer hover:text-primary/80 transition-colors',
                rel: 'noopener noreferrer',
                target: '_blank',
            },
            validate: (href) => /^https?:\/\//.test(href), // Only http(s) links
        }),
        // 🎨 Text Highlighting - Yellow marker effect!
        Highlight.configure({
            multicolor: false, // Single color for now (yellow)
            HTMLAttributes: {
                class: 'highlighted-text',
            },
        }),
        // 🎨 More text formatting
        Underline,
        Superscript,
        Subscript,
        // 📢 Callout/Alert Boxes
        CalloutNode,
        // 🎬 YouTube Embeds
        YouTubeNode,
        // 📹 Vimeo Embeds
        VimeoNode,
        // 📄 PDF Embeds
        PDFNode,
        // 💻 Gist Embeds
        GistNode,
        // 💬 Enhanced Blockquotes
        EnhancedBlockquote,
        // 📝 Footnotes
        FootnoteReference,
        FootnoteDefinition,
        FootnotesSection,
        // 📑 Table of Contents
        TOCNode,
        MermaidNode,
        SlashCommandExtension.configure({
            suggestion: slashCommandSuggestion(
                () => setShowDiagramMenu(true),
                (action) => {
                    setShowAIModal(true);
                    // TODO: Set AI prompt based on action
                },
                () => setShowTableModal(true)
            ),
        }),
        GhostTextExtension.configure({
            isEnabled: () => aiHintsEnabledRef.current.enabled,
            debounceMs: 800,
            onTrigger: async (context: string) => {
                return await getMockAISuggestion(context);
            },
        }),
        AIAutocompleteExtension.configure({
            enabled: aiAutocompleteEnabled,
            debounceMs: 1000,
            minChars: 30,
            onSuggestion: getAIAutocompleteSuggestion,
        }),
    ];
};
