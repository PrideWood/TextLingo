export interface ObsidianNewNoteParams {
  vault: string;
  folder?: string;
  fileName: string;
  content?: string;
}

export interface ObsidianTemplateData {
  title: string;
  date?: Date;
}

export function buildObsidianNewNoteUri(params: ObsidianNewNoteParams) {
  const folder = params.folder?.trim().replace(/^\/+|\/+$/g, '');
  const fileName = params.fileName.endsWith('.md') ? params.fileName : `${params.fileName}.md`;
  const filePath = [folder, fileName].filter(Boolean).join('/');
  const query = [
    `vault=${encodeURIComponent(params.vault)}`,
    `file=${encodeURIComponent(filePath)}`,
    params.content ? `content=${encodeURIComponent(params.content)}` : '',
  ].filter(Boolean).join('&');

  return `obsidian://new?${query}`;
}

export function createSafeObsidianFileName(title: string) {
  const fallback = 'Untitled TextLingo Note';
  const cleaned = (title || fallback)
    .replace(/[\\/:*?"<>|#^[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 96)
    .trim();

  return cleaned || fallback;
}

export function applyObsidianFileNameTemplate(template: string, data: ObsidianTemplateData) {
  const date = formatDate(data.date ?? new Date());
  const safeTitle = createSafeObsidianFileName(data.title);
  const applied = (template || '{{date}} - {{title}}')
    .replaceAll('{{date}}', date)
    .replaceAll('{{title}}', safeTitle);

  return createSafeObsidianFileName(applied);
}

export function openObsidianUri(uri: string, openAfterCreate = true) {
  if (!openAfterCreate) return;
  const link = document.createElement('a');
  link.href = uri;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
