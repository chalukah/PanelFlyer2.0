/**
 * Modern email template wrapper with professional styling
 * Matches the OCT 29 Panel Event email format
 */

export interface EmailWrapperOptions {
  title: string;
  includeNoteBox?: boolean;
  includeQuestionList?: boolean;
}

/**
 * Wraps email content in a modern, professional HTML template
 * This matches the styling from OCT 29 Panel Event emails
 */
export function wrapEmailContent(content: string, options: EmailWrapperOptions): string {
  const { title, includeNoteBox = false, includeQuestionList = false } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        :root {
            color-scheme: light;
        }
        body {
            margin: 0;
            padding: 48px 20px;
            background-color: #f4f6fb;
            font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
            color: #1f2937;
        }
        .email-wrapper {
            max-width: 720px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 18px;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
            overflow: hidden;
        }
        .email-body {
            padding: 44px 48px 40px;
            font-size: 16px;
            line-height: 1.75;
        }
        .email-body p {
            margin: 0 0 18px;
        }
        .email-body p:last-child {
            margin-bottom: 0;
        }
        .email-body ul,
        .email-body ol {
            margin: 0 0 22px 18px;
            padding-left: 22px;
        }
        .email-body li {
            margin: 6px 0;
        }
        ${includeNoteBox ? `
        .note {
            margin: 30px 0 26px;
            padding: 18px 22px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.12));
            border: 1px solid rgba(37, 99, 235, 0.18);
            border-radius: 14px;
        }
        .note p {
            margin: 0;
        }
        ` : ''}
        ${includeQuestionList ? `
        .question-list p {
            margin-bottom: 14px;
        }
        .question-list p:last-child {
            margin-bottom: 0;
        }
        ` : ''}
        .signature p {
            margin-bottom: 6px;
        }
        .signature p:last-child {
            margin-bottom: 0;
        }
        a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
        }
        a:hover {
            text-decoration: underline;
            color: #1d4ed8;
        }
        strong {
            font-weight: 600;
        }
        @media (max-width: 600px) {
            body {
                padding: 32px 12px;
            }
            .email-body {
                padding: 32px 24px 28px;
                font-size: 15px;
            }
            ${includeNoteBox ? `
            .note {
                padding: 16px 18px;
            }
            ` : ''}
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-body">
${content}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Creates standard signature block
 */
export function createSignature(name: string = 'Chaluka Harsha'): string {
  return `            <div class="signature">
                <p>Best regards,</p>
                <p>${escapeHtml(name)}</p>
                <p>Strategic Events and Partnerships Coordinator</p>
                <p>Veterinary Business Institute</p>
            </div>`;
}

/**
 * Creates a note/callout box
 */
export function createNoteBox(content: string): string {
  return `            <div class="note">
                <p>${content}</p>
            </div>`;
}

/**
 * Creates a question list (for panelist questions)
 */
export function createQuestionList(questions: string[]): string {
  const questionItems = questions
    .map((q, index) => `                <p>${index + 1}. ${escapeHtml(q)}</p>`)
    .join('\n');

  return `            <div class="question-list">
${questionItems}
            </div>`;
}

/**
 * Formats email body content from simple HTML to modern template format
 * Removes old DOCTYPE/html/head/body tags and extracts just the content
 */
export function extractEmailContent(oldHtml: string): string {
  // Remove DOCTYPE, html, head, and style tags
  let content = oldHtml
    .replace(/<!DOCTYPE html>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '');

  // Clean up excessive whitespace
  content = content.trim();

  // Ensure proper indentation for wrapping
  content = content
    .split('\n')
    .map(line => '            ' + line.trim())
    .join('\n');

  return content;
}
