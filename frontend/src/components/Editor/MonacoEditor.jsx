import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';

const MonacoEditorWithCommands = forwardRef(({ language, value, onCodeChange, activeLine }, ref) => {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const decorationsRef = useRef([]);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Define CSS for execution line highlight
        monaco.editor.defineTheme('vs-dark-exec', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {},
        });

        // Register custom CSS via the editor's DOM
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .exec-line-highlight {
                background: rgba(0,122,204,0.15) !important;
                border-left: 3px solid #007acc !important;
            }
            .exec-line-highlight-glow {
                box-shadow: inset 0 0 20px rgba(0,122,204,0.12), 0 0 8px rgba(0,122,204,0.15);
            }
            .exec-line-highlight-margin {
                background: rgba(0,122,204,0.3);
                border-radius: 50%;
                margin-left: 4px;
            }
        `;
        document.head.appendChild(styleEl);
    };

    // Apply line highlight
    const highlightLine = useCallback((lineNumber) => {
        if (!editorRef.current || !monacoRef.current || !lineNumber) return;
        const monaco = monacoRef.current;
        const editor = editorRef.current;

        decorationsRef.current = editor.deltaDecorations(
            decorationsRef.current,
            [{
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: 'exec-line-highlight',
                    glyphMarginClassName: 'exec-line-highlight-margin',
                    overviewRuler: {
                        color: '#007acc',
                        position: monaco.editor.OverviewRulerLane.Full,
                    },
                },
            }]
        );

        // Smooth scroll to the line
        editor.revealLineInCenterIfOutsideViewport(lineNumber, monaco.editor.ScrollType.Smooth);
    }, []);

    const clearHighlights = useCallback(() => {
        if (!editorRef.current) return;
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }, []);

    // React to activeLine prop changes
    React.useEffect(() => {
        if (activeLine) {
            highlightLine(activeLine);
        } else {
            clearHighlights();
        }
    }, [activeLine, highlightLine, clearHighlights]);

    useImperativeHandle(ref, () => ({
        triggerCommand: (actionId) => {
            if (editorRef.current) {
                if (actionId === 'selectAll') {
                    const model = editorRef.current.getModel();
                    editorRef.current.setSelection(model.getFullModelRange());
                } else {
                    editorRef.current.trigger('menu', actionId, null);
                }
                editorRef.current.focus();
            }
        },
        focus: () => {
            if (editorRef.current) editorRef.current.focus();
        },
        highlightLine,
        clearHighlights,
    }));

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={value}
                onChange={onCodeChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
                    wordWrap: 'on',
                    contextmenu: true,
                    lineNumbers: 'on',
                    renderLineHighlight: 'line',
                    scrollBeyondLastLine: false,
                    bracketPairColorization: { enabled: true },
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                    padding: { top: 8 },
                    automaticLayout: true,
                    glyphMargin: true,
                }}
            />
        </div>
    );
});

export default MonacoEditorWithCommands;
