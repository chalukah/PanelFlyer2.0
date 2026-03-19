import React, { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Save, Copy, Eye, EyeOff, Undo2, Redo2, Variable } from 'lucide-react';
import { TEMPLATE_VARIABLES, replaceWithSampleData } from '../utils/templateVariables';
import { useUndoRedo } from '../hooks/useUndoRedo';

type Props = {
  initialHtml: string;
  templateName: string;
  onSave: (html: string, name: string) => void;
  onClose?: () => void;
  darkMode?: boolean;
};

export function TemplateEditor({ initialHtml, templateName, onSave, onClose, darkMode }: Props) {
  const { state: html, set: setHtml, undo, redo, canUndo, canRedo } = useUndoRedo(initialHtml);
  const [name, setName] = useState(templateName);
  const [showPreview, setShowPreview] = useState(true);
  const [showVariablePanel, setShowVariablePanel] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const editorRef = useRef<any>(null);

  // Debounced preview update
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewHtml(replaceWithSampleData(html));
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [html]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Register template variable completions
    monaco.languages.registerCompletionItemProvider('html', {
      triggerCharacters: ['['],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = TEMPLATE_VARIABLES.map(v => ({
          label: v.name,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: v.name,
          range,
          detail: v.description,
          documentation: `Example: ${v.example}`,
        }));

        return { suggestions };
      },
    });
  }, []);

  const insertVariable = useCallback((varName: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = editor.getSelection();
    if (selection) {
      editor.executeEdits('insert-variable', [{
        range: selection,
        text: varName,
      }]);
    }
    editor.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 's') { e.preventDefault(); onSave(html, name); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [html, name, undo, redo, onSave]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm font-medium text-gray-900 dark:text-white flex-1 max-w-xs"
          placeholder="Template name"
        />

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30" title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30" title="Redo (Ctrl+Y)">
            <Redo2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            onClick={() => setShowVariablePanel(!showVariablePanel)}
            className={`p-1.5 rounded ${showVariablePanel ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'}`}
            title="Template Variables"
          >
            <Variable className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            {showPreview ? <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            onClick={() => navigator.clipboard.writeText(html)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            title="Copy HTML"
          >
            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => onSave(html, name)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Variable Panel (collapsible sidebar) */}
        {showVariablePanel && (
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Template Variables</h3>
            {(['event', 'panelist', 'banner', 'email'] as const).map(cat => (
              <div key={cat} className="mb-3">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize mb-1">{cat}</h4>
                {TEMPLATE_VARIABLES.filter(v => v.category === cat).map(v => (
                  <button
                    key={v.name}
                    onClick={() => insertVariable(v.name)}
                    className="block w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 truncate"
                    title={`${v.description}\nExample: ${v.example}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Editor */}
        <div className={`flex-1 ${showPreview ? 'w-1/2' : 'w-full'}`}>
          <Editor
            height="100%"
            language="html"
            theme={darkMode ? 'vs-dark' : 'light'}
            value={html}
            onChange={val => setHtml(val || '')}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-950 overflow-hidden flex flex-col">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              Preview (with sample data)
            </div>
            <div className="flex-1 overflow-auto flex items-start justify-center p-4">
              <iframe
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                className="w-[540px] h-[540px] border border-gray-300 dark:border-gray-600 bg-white"
                style={{ transformOrigin: 'top center' }}
                title="Template Preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
