import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, Copy, ChevronRight, FileCode, Loader2 } from 'lucide-react';
import { TemplateEditor } from './TemplateEditor';
import { loadCustomTemplates, upsertCustomTemplate, deleteCustomTemplate } from '../lib/supabaseSync';
import type { CustomBannerTemplate } from '../utils/schemas';
import { BANNER_THEMES } from '../utils/bannerTemplates';

type Props = {
  darkMode?: boolean;
};

const STARTER_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    .banner { width: 1080px; height: 1080px; position: relative; overflow: hidden; background: linear-gradient(135deg, #0a4a44, #071510); color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .header { position: absolute; top: 0; left: 0; right: 0; background: #DDE821; color: #000; text-align: center; padding: 16px; font-weight: 700; font-size: 18px; letter-spacing: 2px; text-transform: uppercase; }
    .title { font-size: 48px; font-weight: 800; text-align: center; margin-top: 80px; }
    .subtitle { font-size: 24px; color: #c8f0a0; text-align: center; margin-top: 16px; }
    .panelists { display: flex; gap: 32px; margin-top: 40px; }
    .panelist { text-align: center; }
    .panelist img { width: 180px; height: 180px; border-radius: 50%; object-fit: cover; border: 3px solid #62E53E; }
    .panelist-name { font-weight: 700; margin-top: 12px; font-size: 18px; }
    .panelist-title { font-size: 14px; color: #c8f0a0; }
    .cta { margin-top: 40px; background: #004D25; color: #DDE821; padding: 16px 48px; border-radius: 8px; font-weight: 700; font-size: 20px; }
  </style>
</head>
<body>
  <div class="banner">
    <div class="header">[HEADER_TEXT]</div>
    <div class="title">[PANEL_TOPIC]</div>
    <div class="subtitle">[PANEL_SUBTITLE]</div>
    <div class="panelists">
      <div class="panelist">
        <img src="[PANELIST_1_HEADSHOT]" alt="[PANELIST_1_NAME]" />
        <div class="panelist-name">[PANELIST_1_NAME]</div>
        <div class="panelist-title">[PANELIST_1_TITLE]</div>
      </div>
      <div class="panelist">
        <img src="[PANELIST_2_HEADSHOT]" alt="[PANELIST_2_NAME]" />
        <div class="panelist-name">[PANELIST_2_NAME]</div>
        <div class="panelist-title">[PANELIST_2_TITLE]</div>
      </div>
    </div>
    <div class="cta">REGISTER NOW</div>
  </div>
</body>
</html>`;

export function TemplateManager({ darkMode }: Props) {
  const [templates, setTemplates] = useState<CustomBannerTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<CustomBannerTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  // Load templates
  useEffect(() => {
    loadCustomTemplates().then(t => {
      setTemplates(t);
      setLoading(false);
    });
  }, []);

  const handleCreate = useCallback(() => {
    const newTemplate: CustomBannerTemplate = {
      id: crypto.randomUUID(),
      name: 'New Template',
      htmlTemplate: STARTER_TEMPLATE,
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingTemplate(newTemplate);
  }, []);

  const handleCloneBuiltIn = useCallback((themeId: string) => {
    // Clone the starter template with theme-specific colors
    const theme = BANNER_THEMES.find(t => t.id === themeId);
    const cloned: CustomBannerTemplate = {
      id: crypto.randomUUID(),
      name: `Custom ${theme?.name || 'Template'}`,
      htmlTemplate: STARTER_TEMPLATE.replace('#0a4a44', theme?.swatch[0] || '#0a4a44')
        .replace('#DDE821', theme?.swatch[1] || '#DDE821'),
      variables: [],
      clonedFrom: themeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingTemplate(cloned);
  }, []);

  const handleSave = useCallback(async (html: string, name: string) => {
    if (!editingTemplate) return;
    const updated: CustomBannerTemplate = {
      ...editingTemplate,
      name,
      htmlTemplate: html,
      updatedAt: new Date().toISOString(),
    };

    await upsertCustomTemplate(updated);

    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });

    setEditingTemplate(null);
  }, [editingTemplate]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteCustomTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  // If editing, show full-screen editor
  if (editingTemplate) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setEditingTemplate(null)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Templates
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{editingTemplate.name}</span>
        </div>
        <div className="flex-1">
          <TemplateEditor
            initialHtml={editingTemplate.htmlTemplate}
            templateName={editingTemplate.name}
            onSave={handleSave}
            onClose={() => setEditingTemplate(null)}
            darkMode={darkMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Banner Templates</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create and edit custom HTML banner templates</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Built-in themes */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Clone from Built-in Themes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {BANNER_THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleCloneBuiltIn(theme.id)}
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="flex gap-1">
                <div className="w-5 h-5 rounded-full" style={{ background: theme.swatch[0] }} />
                <div className="w-5 h-5 rounded-full" style={{ background: theme.swatch[1] }} />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{theme.name}</div>
                <div className="text-xs text-gray-400">Clone & edit</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom templates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Your Custom Templates</h3>
        {loading ? (
          <div className="flex items-center gap-2 p-4 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <FileCode className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No custom templates yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create one from scratch or clone a built-in theme</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-gray-400">
                      {t.clonedFrom ? `Cloned from ${t.clonedFrom}` : 'Custom'} &middot; Updated {new Date(t.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingTemplate(t)}
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => {
                      const cloned: CustomBannerTemplate = {
                        ...t,
                        id: crypto.randomUUID(),
                        name: `${t.name} (Copy)`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      setEditingTemplate(cloned);
                    }}
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
