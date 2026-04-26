export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text.trim()) return false;

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Clipboard API copy failed, falling back to textarea copy:', error);
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);

    return copied;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
}

export function selectElementText(element: HTMLElement | null) {
  if (!element) return false;

  try {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();

    if (!selection) return false;

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch (error) {
    console.error('Select text failed:', error);
    return false;
  }
}
