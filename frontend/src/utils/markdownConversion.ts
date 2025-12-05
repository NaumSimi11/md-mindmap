import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';

// 🎉 Simple emoji shortcode map
const emojiMap: Record<string, string> = {
    'smile': '😀', 'grin': '😁', 'joy': '😂', 'heart': '❤️', 'fire': '🔥',
    'rocket': '🚀', 'star': '⭐', 'thumbsup': '👍', 'thumbsdown': '👎',
    'tada': '🎉', 'sparkles': '✨', 'zap': '⚡', 'boom': '💥', 'bulb': '💡',
    'warning': '⚠️', 'x': '❌', 'check': '✅', 'white_check_mark': '✅',
    'heavy_check_mark': '✔️', 'construction': '🚧', 'lock': '🔒',
    'key': '🔑', 'bell': '🔔', 'bookmark': '🔖', 'link': '🔗',
    'mag': '🔍', 'gear': '⚙️', 'tools': '🛠️', 'hammer': '🔨',
    'pencil': '✏️', 'memo': '📝', 'books': '📚', 'book': '📖',
    'newspaper': '📰', 'calendar': '📅', 'chart': '📊', 'bar_chart': '📊',
    'computer': '💻', 'phone': '📱', 'email': '📧', 'inbox': '📥',
    'package': '📦', 'folder': '📁', 'file': '📄', 'camera': '📷',
    'movie': '🎬', 'art': '🎨', 'game': '🎮', 'trophy': '🏆',
    'medal': '🏅', 'flag': '🚩', 'wave': '👋', 'clap': '👏',
    'pray': '🙏', 'muscle': '💪', 'eyes': '👀', 'brain': '🧠',
    'bug': '🐛', 'sunny': '☀️', 'cloud': '☁️', 'umbrella': '☂️',
    'coffee': '☕', 'pizza': '🍕', 'beer': '🍺', 'cake': '🎂',
};

// Initialize markdown parser
export const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true, // Convert \n to <br>
    highlight: (str, lang) => {
        // 🔥 Enable syntax highlighting in markdown-it
        // Return pre-formatted code that will be highlighted by Prism in useEffect
        if (lang) {
            return `<pre class="line-numbers language-${lang}"><code class="language-${lang}">${md.utils.escapeHtml(str)}</code></pre>`;
        }
        // Fallback for unknown languages
        return `<pre class="line-numbers"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
});

// 🔥 TABLE ALIGNMENT SUPPORT - Override table rendering to preserve alignment
// Store the default table renderer
const defaultTableRender = md.renderer.rules.table_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};

const defaultTdRender = md.renderer.rules.td_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};

const defaultThRender = md.renderer.rules.th_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};

// Custom renderer for table cells to add alignment data
md.renderer.rules.td_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    // markdown-it stores alignment info in token.attrGet('style')
    const align = token.attrGet('style')?.match(/text-align:(left|center|right)/)?.[1];
    if (align) {
        token.attrSet('data-align', align);
    }
    return defaultTdRender(tokens, idx, options, env, self);
};

md.renderer.rules.th_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const align = token.attrGet('style')?.match(/text-align:(left|center|right)/)?.[1];
    if (align) {
        token.attrSet('data-align', align);
    }
    return defaultThRender(tokens, idx, options, env, self);
};

// 🎉 Add simple emoji replacement rule
md.core.ruler.after('inline', 'emoji', (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
        if (state.tokens[i].type === 'inline' && state.tokens[i].children) {
            const children = state.tokens[i].children || [];
            for (let j = 0; j < children.length; j++) {
                if (children[j].type === 'text') {
                    const text = children[j].content;
                    // Replace :emoji_name: with actual emoji
                    const replaced = text.replace(/:([a-z_]+):/g, (match, name) => {
                        return emojiMap[name] || match;
                    });
                    if (replaced !== text) {
                        children[j].content = replaced;
                    }
                }
            }
        }
    }
    return true;
});

// 🎨 Add highlighting support - Parse ==text== to <mark> tags
md.core.ruler.after('inline', 'highlight', (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
        if (state.tokens[i].type === 'inline' && state.tokens[i].children) {
            const children = state.tokens[i].children || [];
            const newChildren: any[] = [];

            for (let j = 0; j < children.length; j++) {
                if (children[j].type === 'text') {
                    const text = children[j].content;
                    // Split by ==highlighted text== pattern
                    const parts = text.split(/(==.+?==)/g);

                    parts.forEach(part => {
                        if (!part) return;

                        if (part.startsWith('==') && part.endsWith('==')) {
                            // This is highlighted text
                            const highlightedText = part.slice(2, -2); // Remove == markers

                            // Create opening <mark> token
                            const markOpen = new state.Token('html_inline', '', 0);
                            markOpen.content = '<mark class="highlighted-text">';
                            newChildren.push(markOpen);

                            // Create text token
                            const textToken = new state.Token('text', '', 0);
                            textToken.content = highlightedText;
                            newChildren.push(textToken);

                            // Create closing </mark> token
                            const markClose = new state.Token('html_inline', '', 0);
                            markClose.content = '</mark>';
                            newChildren.push(markClose);
                        } else {
                            // Regular text
                            const textToken = new state.Token('text', '', 0);
                            textToken.content = part;
                            newChildren.push(textToken);
                        }
                    });
                } else {
                    // Keep non-text tokens as-is
                    newChildren.push(children[j]);
                }
            }

            // Replace children with new tokens
            if (newChildren.length > 0) {
                state.tokens[i].children = newChildren;
            }
        }
    }
    return true;
});

// 🎨 Add superscript support - Parse ^text^ to <sup> tags
md.core.ruler.after('inline', 'superscript', (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
        if (state.tokens[i].type === 'inline' && state.tokens[i].children) {
            const children = state.tokens[i].children || [];
            const newChildren: any[] = [];

            for (let j = 0; j < children.length; j++) {
                if (children[j].type === 'text') {
                    const text = children[j].content;
                    // Split by ^text^ pattern
                    const parts = text.split(/(\^.+?\^)/g);

                    parts.forEach(part => {
                        if (!part) return;

                        if (part.startsWith('^') && part.endsWith('^') && part.length > 2) {
                            // This is superscript text
                            const supText = part.slice(1, -1); // Remove ^ markers

                            // Create <sup> tag
                            const supOpen = new state.Token('html_inline', '', 0);
                            supOpen.content = '<sup>';
                            newChildren.push(supOpen);

                            const textToken = new state.Token('text', '', 0);
                            textToken.content = supText;
                            newChildren.push(textToken);

                            const supClose = new state.Token('html_inline', '', 0);
                            supClose.content = '</sup>';
                            newChildren.push(supClose);
                        } else {
                            // Regular text
                            const textToken = new state.Token('text', '', 0);
                            textToken.content = part;
                            newChildren.push(textToken);
                        }
                    });
                } else {
                    newChildren.push(children[j]);
                }
            }

            state.tokens[i].children = newChildren;
        }
    }
    return true;
});

// 🎨 Add subscript support - Parse ~text~ to <sub> tags
md.core.ruler.after('superscript', 'subscript', (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
        if (state.tokens[i].type === 'inline' && state.tokens[i].children) {
            const children = state.tokens[i].children || [];
            const newChildren: any[] = [];

            for (let j = 0; j < children.length; j++) {
                if (children[j].type === 'text') {
                    const text = children[j].content;
                    // Split by ~text~ pattern (but avoid ~~strikethrough~~)
                    const parts = text.split(/([~][^~]+?[~](?!~))/g);

                    parts.forEach(part => {
                        if (!part) return;

                        if (part.startsWith('~') && part.endsWith('~') && part.length > 2 && !part.includes('~~')) {
                            // This is subscript text
                            const subText = part.slice(1, -1); // Remove ~ markers

                            // Create <sub> tag
                            const subOpen = new state.Token('html_inline', '', 0);
                            subOpen.content = '<sub>';
                            newChildren.push(subOpen);

                            const textToken = new state.Token('text', '', 0);
                            textToken.content = subText;
                            newChildren.push(textToken);

                            const subClose = new state.Token('html_inline', '', 0);
                            subClose.content = '</sub>';
                            newChildren.push(subClose);
                        } else {
                            // Regular text
                            const textToken = new state.Token('text', '', 0);
                            textToken.content = part;
                            newChildren.push(textToken);
                        }
                    });
                } else {
                    newChildren.push(children[j]);
                }
            }

            state.tokens[i].children = newChildren;
        }
    }
    return true;
});

// 💬 Enhanced Blockquotes - Parse GitHub-style callouts like > [!note]
md.core.ruler.after('block', 'enhanced_blockquote', (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
        const token = state.tokens[i];

        if (token.type === 'blockquote_open') {
            // Look ahead for the first paragraph content
            for (let j = i + 1; j < state.tokens.length && j < i + 10; j++) {
                const nextToken = state.tokens[j];

                if (nextToken.type === 'inline' && nextToken.content) {
                    // Check for [!type] at the start
                    const match = nextToken.content.match(/^\[!(note|tip|important|warning|caution)\]\s*/i);
                    if (match) {
                        const type = match[1].toLowerCase();
                        // Add the type attribute to the blockquote_open token
                        token.attrSet('data-blockquote-type', type);
                        token.attrJoin('class', `blockquote-${type}`);
                        // Remove the [!type] marker from the content
                        nextToken.content = nextToken.content.substring(match[0].length);
                        break;
                    }
                }

                // Stop at blockquote_close
                if (nextToken.type === 'blockquote_close') break;
            }
        }
    }
    return true;
});

// 📢 Add callout/alert support - Parse :::type to <div> callout boxes
md.block.ruler.after('fence', 'callout', (state, startLine, endLine, silent) => {
    // Safety check
    if (!state.bCount || !state.tShift || !state.eMarks) return false;
    if (startLine >= endLine) return false;

    let pos = state.bCount[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // Check for ::: at start of line
    if (pos + 3 > max) return false;

    const marker = state.src.slice(pos, pos + 3);
    if (marker !== ':::') return false;

    pos += 3;

    // Get callout type
    let type = state.src.slice(pos, max).trim();
    if (!type) type = 'info';

    // Valid types
    const validTypes = ['info', 'warning', 'danger', 'success'];
    if (!validTypes.includes(type)) type = 'info';

    if (silent) return true;

    let nextLine = startLine;
    let autoClose = false;

    // Search for closing :::
    for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
        if (!state.bCount[nextLine] || !state.tShift[nextLine] || !state.eMarks[nextLine]) break;

        pos = state.bCount[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];

        if (pos < max && state.sCount && state.sCount[nextLine] < state.blkIndent) {
            // Non-empty line with negative indent should stop the list
            break;
        }

        if (state.src.slice(pos, max).trim() === ':::') {
            autoClose = true;
            break;
        }
    }

    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;
    state.parentType = 'callout';

    let token = state.push('callout_open', 'div', 1);
    token.markup = ':::';
    token.block = true;
    token.info = type;
    token.map = [startLine, nextLine];

    state.md.block.tokenize(state, startLine + 1, autoClose ? nextLine : nextLine + 1);

    token = state.push('callout_close', 'div', -1);
    token.markup = ':::';
    token.block = true;

    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = autoClose ? nextLine + 1 : nextLine;

    return true;
});

// Renderer for callout_open
md.renderer.rules.callout_open = (tokens, idx) => {
    const type = tokens[idx].info || 'info';
    return `<div data-callout-type="${type}" class="callout callout-${type}">`;
};

// Renderer for callout_close
md.renderer.rules.callout_close = () => {
    return '</div>';
};

// 🎬 YouTube embed support
md.inline.ruler.before('link', 'youtube', (state, silent) => {
    const start = state.pos;
    const max = state.posMax;

    if (state.src.charCodeAt(start) === 0x5B /* [ */) {
        const match = state.src.slice(start).match(/^\[youtube:([a-zA-Z0-9_-]{11})\]/);
        if (match) {
            if (!silent) {
                const token = state.push('youtube', '', 0);
                token.content = match[1];
            }
            state.pos += match[0].length;
            return true;
        }
    }

    if (state.src.slice(start, start + 8) === 'https://' || state.src.slice(start, start + 7) === 'http://') {
        const urlMatch = state.src.slice(start).match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?][\w=&-]*)?/);
        if (urlMatch) {
            if (!silent) {
                const token = state.push('youtube', '', 0);
                token.content = urlMatch[1];
            }
            state.pos += urlMatch[0].length;
            return true;
        }
    }

    return false;
});

md.renderer.rules.youtube = (tokens, idx) => {
    const videoId = tokens[idx].content;
    return `<div data-youtube-video data-video-id="${videoId}" class="youtube-embed"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen width="640" height="360"></iframe></div>`;
};

// 📹 Vimeo embed support
md.inline.ruler.before('link', 'vimeo', (state, silent) => {
    const start = state.pos;
    const max = state.posMax;

    if (state.src.charCodeAt(start) === 0x5B /* [ */) {
        const match = state.src.slice(start).match(/^\[vimeo:(\d{8,})\]/);
        if (match) {
            if (!silent) {
                const token = state.push('vimeo', '', 0);
                token.content = match[1];
            }
            state.pos += match[0].length;
            return true;
        }
    }

    return false;
});

md.renderer.rules.vimeo = (tokens, idx) => {
    const videoId = tokens[idx].content;
    return `<div data-vimeo-video data-video-id="${videoId}" class="vimeo-embed"><iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen width="640" height="360"></iframe></div>`;
};

// 💻 Gist embed support
md.inline.ruler.before('link', 'gist', (state, silent) => {
    const start = state.pos;
    const max = state.posMax;

    if (state.src.charCodeAt(start) === 0x5B /* [ */) {
        const match = state.src.slice(start).match(/^\[gist:([\w-]+(?:\/[\w-]+)?)\]/);
        if (match) {
            if (!silent) {
                const token = state.push('gist', '', 0);
                token.content = match[1];
            }
            state.pos += match[0].length;
            return true;
        }
    }

    return false;
});

md.renderer.rules.gist = (tokens, idx) => {
    const gistId = tokens[idx].content;
    return `<div data-gist-embed data-gist-id="${gistId}" class="gist-embed"><script src="https://gist.github.com/${gistId}.js"></script></div>`;
};

// 📑 TOC support
md.inline.ruler.after('link', 'toc_placeholder', (state, silent) => {
    const start = state.pos;
    const max = state.posMax;

    if (start + 5 > max) return false;
    if (state.src.charCodeAt(start) !== 0x5B /* [ */) return false;

    if (state.src.slice(start, start + 5) === '[TOC]') {
        if (!silent) {
            const token = state.push('toc_placeholder', '', 0);
            token.markup = '[TOC]';
        }
        state.pos = start + 5;
        return true;
    }

    if (state.src.slice(start, start + 7) === '[[TOC]]') {
        if (!silent) {
            const token = state.push('toc_placeholder', '', 0);
            token.markup = '[[TOC]]';
        }
        state.pos = start + 7;
        return true;
    }

    return false;
});

md.renderer.rules.toc_placeholder = () => {
    return '<div data-toc="true" data-toc-placeholder="true"></div>';
};

// 📝 Footnote support
md.inline.ruler.after('link', 'footnote_ref', (state, silent) => {
    const start = state.pos;
    const max = state.posMax;

    if (start + 3 > max) return false;
    if (state.src.charCodeAt(start) !== 0x5B /* [ */) return false;
    if (state.src.charCodeAt(start + 1) !== 0x5E /* ^ */) return false;

    let labelEnd = start + 2;
    while (labelEnd < max && state.src.charCodeAt(labelEnd) !== 0x5D /* ] */) {
        labelEnd++;
    }

    if (labelEnd >= max) return false;

    const label = state.src.slice(start + 2, labelEnd);
    if (!label) return false;

    if (!silent) {
        const token = state.push('footnote_ref', '', 0);
        token.meta = { id: label, label };
    }

    state.pos = labelEnd + 1;
    return true;
});

md.renderer.rules.footnote_ref = (tokens, idx) => {
    const meta = tokens[idx].meta;
    return `<sup data-footnote-id="${meta.id}" data-footnote-label="${meta.label}" class="footnote-ref"><a href="#fn-${meta.id}" id="fnref-${meta.id}" class="footnote-ref-link">[${meta.label}]</a></sup>`;
};

md.block.ruler.after('reference', 'footnote_def', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    if (start + 3 > max) return false;
    if (state.src.charCodeAt(start) !== 0x5B /* [ */) return false;
    if (state.src.charCodeAt(start + 1) !== 0x5E /* ^ */) return false;

    let labelEnd = start + 2;
    while (labelEnd < max && state.src.charCodeAt(labelEnd) !== 0x5D /* ] */) {
        labelEnd++;
    }

    if (labelEnd >= max) return false;
    if (state.src.charCodeAt(labelEnd + 1) !== 0x3A /* : */) return false;

    const label = state.src.slice(start + 2, labelEnd);
    if (!label) return false;

    const content = state.src.slice(labelEnd + 2, max).trim();

    if (!silent) {
        const token = state.push('footnote_def_open', 'div', 1);
        token.meta = { id: label, label };

        const inline = state.push('inline', '', 0);
        inline.content = content;
        inline.children = [];

        state.push('footnote_def_close', 'div', -1);
    }

    state.line = startLine + 1;
    return true;
});

md.renderer.rules.footnote_def_open = (tokens, idx) => {
    const meta = tokens[idx].meta;
    return `<div data-footnote-id="${meta.id}" data-footnote-label="${meta.label}" id="fn-${meta.id}" class="footnote-def"><a href="#fnref-${meta.id}" class="footnote-backref">[${meta.label}]</a> <div class="footnote-content">`;
};

md.renderer.rules.footnote_def_close = () => {
    return '</div></div>';
};

// 📄 PDF embed support
md.inline.ruler.after('youtube', 'pdf', (state, silent) => {
    const start = state.pos;
    const max = state.posMax;

    if (state.src.charCodeAt(start) === 0x5B /* [ */) {
        const match = state.src.slice(start).match(/^\[pdf:([^\]]+)\]/);
        if (match) {
            if (!silent) {
                const token = state.push('pdf', '', 0);
                token.content = match[1];
            }
            state.pos += match[0].length;
            return true;
        }
    }

    return false;
});

md.renderer.rules.pdf = (tokens, idx) => {
    const src = tokens[idx].content;
    const cleanSrc = src.replace(/^\[+/, '').replace(/\]+$/, '');
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(cleanSrc)}&embedded=true`;
    return `<div data-pdf-embed data-pdf-src="${cleanSrc}" class="pdf-embed"><iframe src="${viewerUrl}" width="100%" height="600px"></iframe></div>`;
};

// Initialize HTML to markdown converter
export const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

// Add custom rule for Mermaid diagrams
turndownService.addRule('mermaidDiagram', {
    filter: (node) => {
        return node.nodeName === 'DIV' &&
            node.getAttribute('data-type') === 'mermaid';
    },
    replacement: (content, node: any) => {
        const code = node.getAttribute('data-code') || node.textContent || '';
        if (!code) return '';
        return '\n\n```mermaid\n' + code.trim() + '\n```\n\n';
    }
});

// 🎨 Add custom rule for highlighted text
turndownService.addRule('highlight', {
    filter: (node) => {
        return node.nodeName === 'MARK';
    },
    replacement: (content) => {
        return '==' + content + '==';
    }
});

// 💬 Add custom rule for enhanced blockquotes
turndownService.addRule('enhancedBlockquote', {
    filter: 'blockquote',
    replacement: (content, node: any) => {
        const type = node.getAttribute('data-blockquote-type');

        if (type && type !== 'default') {
            return '\n> [!' + type + ']\n> ' + content.trim().replace(/\n/g, '\n> ') + '\n\n';
        }

        return '\n> ' + content.trim().replace(/\n/g, '\n> ') + '\n\n';
    }
});

// 📢 Add custom rule for callout boxes
turndownService.addRule('callout', {
    filter: (node) => {
        return node.nodeName === 'DIV' && node.getAttribute('data-callout-type');
    },
    replacement: (content, node: any) => {
        const type = node.getAttribute('data-callout-type') || 'info';
        return '\n:::' + type + '\n' + content.trim() + '\n:::\n\n';
    }
});

// 🎬 Add custom rule for YouTube embeds
turndownService.addRule('youtube', {
    filter: (node) => {
        return node.nodeName === 'DIV' && node.getAttribute('data-youtube-video');
    },
    replacement: (content, node: any) => {
        const videoId = node.getAttribute('data-video-id');
        if (!videoId) return '';
        return `\n[youtube:${videoId}]\n\n`;
    }
});

// 📹 Add custom rule for Vimeo
turndownService.addRule('vimeo', {
    filter: (node) => {
        return node.nodeName === 'DIV' && node.getAttribute('data-vimeo-video');
    },
    replacement: (content, node: any) => {
        const videoId = node.getAttribute('data-video-id');
        if (!videoId) return '';
        return `\n[vimeo:${videoId}]\n\n`;
    }
});

// 💻 Add custom rule for Gist
turndownService.addRule('gist', {
    filter: (node) => {
        return node.nodeName === 'DIV' && node.getAttribute('data-gist-embed');
    },
    replacement: (content, node: any) => {
        const gistId = node.getAttribute('data-gist-id');
        if (!gistId) return '';
        return `\n[gist:${gistId}]\n\n`;
    }
});

// 📄 Add custom rule for PDF embeds
turndownService.addRule('pdf', {
    filter: (node) => {
        return node.nodeName === 'DIV' && node.getAttribute('data-pdf-embed');
    },
    replacement: (content, node: any) => {
        const src = node.getAttribute('data-pdf-src');
        if (!src) return '';
        return `\n[pdf:${src}]\n\n`;
    }
});

// 📑 Add custom rule for TOC
turndownService.addRule('toc', {
    filter: (node) => {
        return node.nodeName === 'DIV' && node.getAttribute('data-toc') === 'true';
    },
    replacement: () => {
        return '\n\n[TOC]\n\n';
    }
});

// 📝 Add custom rules for footnotes
turndownService.addRule('footnoteReference', {
    filter: (node) => {
        return node.nodeName === 'SUP' && node.getAttribute('data-footnote-id');
    },
    replacement: (content, node: any) => {
        const id = node.getAttribute('data-footnote-id');
        return `[^${id}]`;
    }
});

turndownService.addRule('footnoteDefinition', {
    filter: (node) => {
        return node.nodeName === 'DIV' && node.getAttribute('data-footnote-id') && node.classList.contains('footnote-def');
    },
    replacement: (content, node: any) => {
        const id = node.getAttribute('data-footnote-id');
        const contentDiv = node.querySelector('.footnote-content');
        const text = contentDiv ? contentDiv.textContent?.trim() : content.trim();
        return `\n[^${id}]: ${text}\n`;
    }
});

// 🔥 FIX: Ensure all table cells contain at least a paragraph tag
export const fixEmptyTableCells = (html: string): string => {
    if (!html.includes('<table')) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cells = doc.querySelectorAll('td, th');

    cells.forEach(cell => {
        const align = cell.getAttribute('data-align') || cell.style.textAlign;
        const hasBlockElements = Array.from(cell.childNodes).some(node =>
            node.nodeType === 1 && ['P', 'DIV', 'UL', 'OL', 'PRE', 'BLOCKQUOTE'].includes(node.nodeName)
        );

        if (!hasBlockElements) {
            const currentContent = cell.innerHTML.trim();
            if (currentContent === '' || currentContent === '&nbsp;') {
                cell.innerHTML = '<p></p>';
            } else {
                cell.innerHTML = `<p>${currentContent}</p>`;
            }
        }

        if (align) {
            cell.setAttribute('data-align', align);
        }
    });

    return doc.body.innerHTML;
};

// Helper function to convert markdown to HTML
export const markdownToHtml = (markdown: string): string => {
    if (!markdown || markdown.trim() === '') {
        return '';
    }

    if (markdown.trim().startsWith('<')) {
        return markdown;
    }

    const mermaidRegex = /(\s*```\s*mermaid[\s\S]*?```)/g;
    const parts = markdown.split(mermaidRegex);

    let html = '';
    parts.forEach((part) => {
        if (!part.trim()) return;

        const trimmed = part.trimStart();
        if (/^```\s*mermaid/.test(trimmed)) {
            const m = trimmed.match(/```\s*mermaid\s*[\r\n]+([\s\S]*?)```/);
            const code = m ? m[1].trim() : '';

            if (code) {
                html += `<div data-type="mermaid" data-code="${code.replace(/"/g, '&quot;').replace(/\n/g, '&#10;')}"></div>`;
            }
        } else {
            html += md.render(part);
        }
    });

    html = fixEmptyTableCells(html);
    return html;
};

// Helper function to convert table node to markdown
export const convertTableToMarkdown = (tableNode: any): string => {
    if (!tableNode.content || tableNode.content.length === 0) {
        return '';
    }

    let markdown = '\n';
    const columnAlignments: (string | null)[] = [];

    tableNode.content.forEach((row: any, rowIndex: number) => {
        if (!row.content) return;
        markdown += '| ';

        row.content.forEach((cell: any, cellIndex: number) => {
            if (rowIndex === 0) {
                columnAlignments[cellIndex] = cell.attrs?.textAlign || null;
            }

            let cellText = '';
            if (cell.content) {
                cellText = cell.content.map((n: any) => {
                    if (n.type === 'paragraph') {
                        return n.content?.map((c: any) => {
                            let text = c.text || '';
                            if (c.marks) {
                                c.marks.forEach((mark: any) => {
                                    if (mark.type === 'bold') text = `**${text}**`;
                                    if (mark.type === 'italic') text = `*${text}*`;
                                    if (mark.type === 'underline') text = `<u>${text}</u>`;
                                    if (mark.type === 'code') text = `\`${text}\``;
                                    if (mark.type === 'highlight') text = `==${text}==`;
                                    if (mark.type === 'superscript') text = `^${text}^`;
                                    if (mark.type === 'subscript') text = `~${text}~`;
                                });
                            }
                            return text;
                        }).join('') || '';
                    }
                    return n.text || '';
                }).join('');
            }

            markdown += cellText + ' | ';
        });

        markdown += '\n';

        if (rowIndex === 0) {
            markdown += '| ';
            columnAlignments.forEach((align) => {
                let separator = '---';
                if (align === 'center') {
                    separator = ':---:';
                } else if (align === 'right') {
                    separator = '---:';
                } else if (align === 'left') {
                    separator = ':---';
                }
                markdown += separator + ' | ';
            });
            markdown += '\n';
        }
    });

    markdown += '\n';
    return markdown;
};

// Convert TipTap JSON to Markdown (preserves mermaid diagrams)
export const jsonToMarkdown = (json: any): string => {
    if (!json || !json.content) {
        return '';
    }

    let markdown = '';

    const processNode = (node: any): string => {
        switch (node.type) {
            case 'heading':
                const level = '#'.repeat(node.attrs?.level || 1);
                const text = node.content?.map((n: any) => n.text || '').join('') || '';
                return `${level} ${text}\n\n`;

            case 'paragraph':
                const paraText = node.content?.map(processNode).join('') || '';
                return `${paraText}\n\n`;

            case 'text':
                let text2 = node.text || '';
                if (node.marks) {
                    const hasLink = node.marks.find((m: any) => m.type === 'link');

                    node.marks.forEach((mark: any) => {
                        if (mark.type === 'bold') text2 = `**${text2}**`;
                        if (mark.type === 'italic') text2 = `*${text2}*`;
                        if (mark.type === 'underline') text2 = `<u>${text2}</u>`;
                        if (mark.type === 'code') text2 = `\`${text2}\``;
                        if (mark.type === 'strike') text2 = `~~${text2}~~`;
                        if (mark.type === 'highlight') text2 = `==${text2}==`;
                        if (mark.type === 'superscript') text2 = `^${text2}^`;
                        if (mark.type === 'subscript') text2 = `~${text2}~`;
                    });

                    if (hasLink) {
                        const href = hasLink.attrs?.href || '';
                        const title = hasLink.attrs?.title || '';
                        text2 = title ? `[${text2}](${href} "${title}")` : `[${text2}](${href})`;
                    }
                }
                return text2;

            case 'mermaid':
                const code = node.attrs?.code || '';
                return `\n\`\`\`mermaid\n${code}\n\`\`\`\n\n`;

            case 'callout':
                const calloutType = node.attrs?.type || 'info';
                const calloutContent = node.content?.map(processNode).join('') || '';
                return `\n:::${calloutType}\n${calloutContent.trim()}\n:::\n\n`;

            case 'youtube':
                const videoId = node.attrs?.videoId || '';
                return `\n[youtube:${videoId}]\n\n`;

            case 'pdf':
                const pdfSrc = node.attrs?.src || '';
                return `\n[pdf:${pdfSrc}]\n\n`;

            case 'footnoteReference':
                const refId = node.attrs?.id || node.attrs?.label || '?';
                return `[^${refId}]`;

            case 'footnoteDefinition':
                const defId = node.attrs?.id || node.attrs?.label || '?';
                const defContent = node.content?.map(processNode).join('').trim() || '';
                return `\n[^${defId}]: ${defContent}\n`;

            case 'footnotesSection':
                return '\n' + (node.content?.map(processNode).join('') || '') + '\n';

            case 'toc':
                return '\n\n[TOC]\n\n';

            case 'codeBlock':
                const codeContent = node.content?.map((n: any) => n.text || '').join('') || '';
                const lang = node.attrs?.language || '';
                return `\n\`\`\`${lang}\n${codeContent}\n\`\`\`\n\n`;

            case 'bulletList':
                return node.content?.map((item: any) => {
                    const itemText = item.content?.[0]?.content?.map(processNode).join('') || '';
                    return `- ${itemText}\n`;
                }).join('') || '';

            case 'orderedList':
                return node.content?.map((item: any, idx: number) => {
                    const itemText = item.content?.[0]?.content?.map(processNode).join('') || '';
                    return `${idx + 1}. ${itemText}\n`;
                }).join('') || '';

            case 'blockquote':
                const quoteText = node.content?.map(processNode).join('') || '';
                const quoteType = node.attrs?.type;

                if (quoteType && quoteType !== 'default') {
                    return `> [!${quoteType}]\n> ${quoteText.trim().replace(/\n/g, '\n> ')}\n\n`;
                }

                return `> ${quoteText.trim().replace(/\n/g, '\n> ')}\n\n`;

            case 'hardBreak':
                return '\n';

            case 'table':
                return convertTableToMarkdown(node);

            case 'tableRow':
                return '';

            case 'tableHeader':
            case 'tableCell':
                const cellText = node.content?.map((n: any) => {
                    if (n.type === 'paragraph') {
                        return n.content?.map(processNode).join('') || '';
                    }
                    return processNode(n);
                }).join('') || '';
                return cellText;

            default:
                if (node.content) {
                    return node.content.map(processNode).join('');
                }
                return '';
        }
    };

    json.content.forEach((node: any) => {
        markdown += processNode(node);
    });

    return markdown.trim();
};

// Helper function to convert HTML to markdown
// Also handles TipTap editor directly to extract mermaid diagrams properly
export const htmlToMarkdown = (html: string, editor?: any): string => {
    try {
        // If we have the editor, use its JSON representation for better mermaid handling
        if (editor) {
            const json = editor.getJSON();
            return jsonToMarkdown(json);
        }

        // Fallback to HTML conversion
        if (!html || html.trim() === '') {
            return '';
        }

        return turndownService.turndown(html);
    } catch (error) {
        console.error('Error converting HTML to markdown:', error);
        return html || '';
    }
};
