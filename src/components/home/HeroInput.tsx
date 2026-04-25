'use client';

import { Image, Loader2, Settings, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, type ClipboardEvent } from 'react';
import { fetchWithAccess, isAccessUnauthorizedError } from '../../../lib/client/api';
import type { ApiResponse, AppPreferences, UiLanguage } from '../../types';
import { SettingsModal } from './SettingsModal';

interface HeroInputProps {
  text: string;
  setText: (value: string) => void;
  inputError: string;
  requestError: string;
  sourceLanguage: string;
  targetLanguage: string;
  uiLanguage: UiLanguage;
  preferences: AppPreferences;
  onPreferencesChange: (preferences: AppPreferences) => void;
  onAnalyze: (text?: string) => void;
  onClear: () => void;
  onAccessExpired: (message: string) => void;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  name?: string;
  size: number;
  type: string;
}

const maxImageSize = 10 * 1024 * 1024;
const supportedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

export function HeroInput({
  text,
  setText,
  inputError,
  requestError,
  sourceLanguage,
  targetLanguage,
  uiLanguage,
  preferences,
  onPreferencesChange,
  onAnalyze,
  onClear,
  onAccessExpired,
}: HeroInputProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textLabel = {
    tagline:
      uiLanguage === 'zh'
        ? '粘贴真实语言素材，自动生成译文、知识点、练习题和可复制的 Markdown 笔记。'
        : 'Paste real language material and turn it into translation, learning points, quizzes, and Markdown notes.',
    placeholder:
      uiLanguage === 'zh'
        ? '粘贴段落、文章节选、对话，或直接粘贴图片...'
        : 'Paste a paragraph, article excerpt, dialogue, or image here...',
    settings: uiLanguage === 'zh' ? '打开设置' : 'Open settings',
    image: uiLanguage === 'zh' ? '识别图片文字' : 'Recognize image text',
    enableOcr: uiLanguage === 'zh' ? '请先在设置中启用 OCR' : 'Enable OCR in Settings first',
    clear: uiLanguage === 'zh' ? '清空' : 'Clear',
    analyze: uiLanguage === 'zh' ? '分析' : 'Analyze',
    removeImage: uiLanguage === 'zh' ? '移除图片' : 'Remove image',
    pendingImage: uiLanguage === 'zh' ? '等待点击分析时 OCR' : 'OCR will run when you analyze',
    recognizing: uiLanguage === 'zh' ? '正在识别文字...' : 'Recognizing text...',
    ocrFormatError: uiLanguage === 'zh' ? 'OCR 服务返回格式异常' : 'Unexpected OCR response format',
    ocrFailed: uiLanguage === 'zh' ? 'OCR 识别失败' : 'OCR failed',
    unsupportedImage: uiLanguage === 'zh' ? '图片格式不支持，请上传 png、jpg、jpeg 或 webp。' : 'Unsupported image format. Use png, jpg, jpeg, or webp.',
    imageTooLarge: uiLanguage === 'zh' ? '图片不能超过 10MB。' : 'Image must be under 10MB.',
  };

  useEffect(() => () => {
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.previewUrl);
    }
  }, [pendingImage]);

  const startOcr = () => {
    if (!preferences.ocr.enableOcr) {
      setOcrError(textLabel.enableOcr);
      return;
    }

    fileInputRef.current?.click();
  };

  const attachImage = (file: File | undefined) => {
    if (!file) return;

    if (!supportedImageTypes.has(file.type)) {
      setOcrError(textLabel.unsupportedImage);
      return;
    }

    if (file.size > maxImageSize) {
      setOcrError(textLabel.imageTooLarge);
      return;
    }

    setOcrError('');
    setOcrStatus('');
    const previewUrl = URL.createObjectURL(file);
    setPendingImage((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return {
        id: `${Date.now()}-${file.name || 'clipboard-image'}`,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    });
  };

  const removePendingImage = () => {
    setPendingImage((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return null;
    });
    setOcrError('');
    setOcrStatus('');
  };

  const recognizeImage = async (file: File) => {
    if (!preferences.ocr.enableOcr) {
      throw new Error(textLabel.enableOcr);
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('provider', preferences.ocr.provider);
    formData.append('model', preferences.ocr.model);
    formData.append('baseUrl', preferences.ocr.baseUrl ?? '');
    formData.append('sourceLanguage', sourceLanguage);

    const response = await fetchWithAccess('/api/ocr', {
      method: 'POST',
      body: formData,
    });
    const json = (await response.json().catch(() => null)) as ApiResponse<{ text: string }> | null;

    if (!json || typeof json.ok !== 'boolean') {
      throw new Error(textLabel.ocrFormatError);
    }
    if (!json.ok) {
        throw new Error(json.error || textLabel.ocrFailed);
    }

    return json.data.text.trim();
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) => item.type.startsWith('image/'));
    const file = imageItem?.getAsFile();

    if (file) {
      attachImage(file);
    }
  };

  const analyzeWithPendingImage = async () => {
    if (!pendingImage) {
      onAnalyze(text);
      return;
    }

    setOcrStatus(textLabel.recognizing);
    setOcrError('');

    try {
      const ocrText = await recognizeImage(pendingImage.file);
      const finalText = [text.trim(), ocrText].filter(Boolean).join('\n\n');
      setText(finalText);
      removePendingImage();
      setOcrStatus('');
      onAnalyze(finalText);
    } catch (error) {
      if (isAccessUnauthorizedError(error)) {
        onAccessExpired(error.message);
        setOcrStatus('');
        return;
      }

      setOcrError(error instanceof Error ? error.message : textLabel.ocrFailed);
      setOcrStatus('');
    }
  };

  const clearInput = () => {
    removePendingImage();
    onClear();
  };

  return (
    <section className="pt-8 text-center md:pt-14">
      <div className="mx-auto flex justify-center">
        <img src="/textlingo-logo.png" alt="TextLingo logo" className="h-auto w-full max-w-[360px] md:max-w-[460px]" />
      </div>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">{textLabel.tagline}</p>

      <div className="mt-8 rounded-2xl border border-black/10 bg-white p-3 text-left shadow-soft dark:border-white/10 dark:bg-zinc-900">
        <textarea
          className="min-h-[240px] w-full resize-y rounded-xl border-0 bg-transparent px-4 py-4 text-base leading-8 text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-500"
          placeholder={textLabel.placeholder}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onPaste={handlePaste}
        />
        {pendingImage ? (
          <div className="mx-2 mb-3 flex max-w-sm items-center gap-3 rounded-lg border border-black/10 bg-zinc-50 p-2 dark:border-white/10 dark:bg-zinc-950">
            <img src={pendingImage.previewUrl} alt={pendingImage.name || 'Pasted image'} className="h-16 w-16 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                {pendingImage.name || 'Clipboard image'}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {(pendingImage.size / 1024 / 1024).toFixed(2)} MB · {textLabel.pendingImage}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label={textLabel.removeImage}
              title={textLabel.removeImage}
              onClick={removePendingImage}
            >
              <X size={15} />
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 border-t border-black/10 px-2 pb-1 pt-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              onClick={() => setSettingsOpen(true)}
              aria-label={textLabel.settings}
              title={textLabel.settings}
              type="button"
            >
              <Settings size={17} />
            </button>
            <button
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              onClick={startOcr}
              aria-label={preferences.ocr.enableOcr ? textLabel.image : textLabel.enableOcr}
              title={preferences.ocr.enableOcr ? textLabel.image : textLabel.enableOcr}
              type="button"
              disabled={ocrStatus === textLabel.recognizing}
            >
              <Image size={17} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(event) => {
                attachImage(event.target.files?.[0]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            />
            <p className="min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">{sourceLanguage} → {targetLanguage}</p>
          </div>
          <div className="flex justify-end gap-2 sm:ml-auto">
            <button className="btn-secondary min-h-10 px-4 py-2" onClick={clearInput} title="清空输入">
              <Trash2 size={16} />
              {textLabel.clear}
            </button>
            <button className="btn-primary min-h-10 px-4 py-2" onClick={analyzeWithPendingImage} disabled={!text.trim() && !pendingImage}>
              {ocrStatus === textLabel.recognizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {textLabel.analyze}
            </button>
          </div>
        </div>
      </div>

      {inputError ? <p className="mt-3 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">{inputError}</p> : null}
      {requestError ? <p className="mt-3 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">{requestError}</p> : null}
      {ocrStatus ? <p className="mt-3 rounded-md bg-mint/10 px-3 py-2 text-sm text-mint">{ocrStatus}</p> : null}
      {ocrError ? <p className="mt-3 rounded-md bg-coral/10 px-3 py-2 text-sm text-coral">{ocrError}</p> : null}
      <SettingsModal
        open={settingsOpen}
        preferences={preferences}
        onSave={onPreferencesChange}
        onClose={() => setSettingsOpen(false)}
      />
    </section>
  );
}
