import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import MediaPicker from './MediaPicker';
import Icon from './Icon';

function plainToHtml(value) {
    if (value == null || value.trim() === '') return '';

    if (value.includes('<')) return value;

    return value
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join('');
}

function ToolbarButton({ icon, label, onClick, active = false }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                active ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
            }`}
        >
            <Icon name={icon} size={16} />
        </button>
    );
}

function Divider() {
    return <span className="mx-1 h-5 w-px bg-line" />;
}

export default function RichEditor({ value = '', onChange, variant = 'full', placeholder = 'Tulis di sini…', minHeight = 200, maxHeight = 420 }) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: variant === 'full',
                bulletList: variant === 'full',
                orderedList: variant === 'full',
                blockquote: variant === 'full',
                codeBlock: variant === 'full',
                horizontalRule: variant === 'full',
                dropcursor: false,
                link: false,
                underline: false,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
            }),
            Image.configure({
                inline: false,
                HTMLAttributes: { class: 'rounded-xl', loading: 'lazy' },
            }),
            Placeholder.configure({ placeholder }),
        ],
        content: plainToHtml(value),
        editorProps: {
            attributes: {
                class: 'rich-editor-focus',
            },
        },
        onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    });

    const toggleLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL link (https://…)', previousUrl ?? 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    if (!editor) return null;

    const is = (name, attrs) => editor.isActive(name, attrs);
    const run = (fn) => () => editor.chain().focus()[fn]().run();

    const insertImage = (sel) => {
        if (!sel?.url) return;
        editor.chain().focus().setImage({ src: sel.url, alt: '' }).run();
    };

    return (
        <div className="overflow-hidden rounded-xl border border-line bg-surface focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-muted/50 px-2 py-1.5">
                <ToolbarButton icon="bold" label="Tebal" active={is('bold')} onClick={run('toggleBold')} />
                <ToolbarButton icon="italic" label="Miring" active={is('italic')} onClick={run('toggleItalic')} />
                <ToolbarButton icon="underline" label="Garis bawah" active={is('underline')} onClick={run('toggleUnderline')} />
                <ToolbarButton icon="strikethrough" label="Coret" active={is('strike')} onClick={run('toggleStrike')} />
                {variant === 'full' && (
                    <>
                        <Divider />
                        <ToolbarButton icon="heading" label="Subjudul" active={is('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                        <ToolbarButton icon="list" label="Daftar" active={is('bulletList')} onClick={run('toggleBulletList')} />
                        <ToolbarButton icon="list-ordered" label="Daftar bernomor" active={is('orderedList')} onClick={run('toggleOrderedList')} />
                        <ToolbarButton icon="quote" label="Kutipan" active={is('blockquote')} onClick={run('toggleBlockquote')} />
                        <ToolbarButton icon="code" label="Kode" active={is('codeBlock')} onClick={run('toggleCodeBlock')} />
                        <Divider />
                        <ToolbarButton icon="link" label="Tautan" active={is('link')} onClick={toggleLink} />
                        <ToolbarButton icon="image" label="Sisipkan gambar" active={is('image')} onClick={() => setPickerOpen(true)} />
                    </>
                )}
                <div className="ml-auto flex items-center gap-0.5">
                    <ToolbarButton icon="undo" label="Urungkan" onClick={run('undo')} />
                    <ToolbarButton icon="redo" label="Ulangi" onClick={run('redo')} />
                    <ToolbarButton icon="remove-formatting" label="Hapus format" onClick={run('unsetAllMarks')} />
                </div>
            </div>
            <EditorContent
                editor={editor}
                className="rich-editor-scroll"
                style={{ minHeight, maxHeight }}
            />
            <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={insertImage} title="Sisipkan Gambar" />
        </div>
    );
}
