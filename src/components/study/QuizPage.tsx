'use client';

import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import type { Language, QuizQuestion, QuizType } from '../../types';
import { getEffectiveQuizType, isSameAnswerSet } from './studyUtils';

export interface QuizWorkState {
  choiceAnswers: Record<string, string[]>;
  textAnswers: Record<string, string>;
  submitted: boolean;
}

interface QuizPageProps {
  questions: QuizQuestion[];
  sourceLanguage: Language;
  state: QuizWorkState;
  onChange: (state: QuizWorkState) => void;
}

const optionLetters = ['A', 'B', 'C', 'D'];

export function QuizPage({ questions, sourceLanguage, state, onChange }: QuizPageProps) {
  const score = useMemo(
    () =>
      questions.filter((question) =>
        getEffectiveQuizType(question) === 'translation'
          ? normalizeTextAnswer(state.textAnswers[question.id] ?? '') === normalizeTextAnswer(question.answer[0] ?? '')
          : isSameAnswerSet(state.choiceAnswers[question.id] ?? [], question.answer),
      ).length,
    [state.choiceAnswers, state.textAnswers, questions],
  );

  const updateSingle = (questionId: string, option: string) => {
    onChange({ ...state, choiceAnswers: { ...state.choiceAnswers, [questionId]: [option] } });
  };

  const updateMultiple = (questionId: string, option: string) => {
    const selected = state.choiceAnswers[questionId] ?? [];
    onChange({
      ...state,
      choiceAnswers: {
        ...state.choiceAnswers,
        [questionId]: selected.includes(option)
          ? selected.filter((item) => item !== option)
          : [...selected, option],
      },
    });
  };

  const updateText = (questionId: string, value: string) => {
    onChange({ ...state, textAnswers: { ...state.textAnswers, [questionId]: value } });
  };

  if (!questions.length) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-black/10 bg-zinc-50 p-6 text-center dark:border-white/10 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No quiz questions generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {state.submitted ? (
        <div className="sticky top-0 z-10 rounded-md border border-mint/30 bg-mint/10 p-4 text-sm font-semibold text-mint backdrop-blur">
          得分：{score} / {questions.length}
        </div>
      ) : null}

      {questions.map((question, index) => {
        const effectiveType = getEffectiveQuizType(question);
        const userChoiceAnswer = state.choiceAnswers[question.id] ?? [];
        const userTextAnswer = state.textAnswers[question.id] ?? '';
        const correct =
          effectiveType === 'translation'
            ? normalizeTextAnswer(userTextAnswer) === normalizeTextAnswer(question.answer[0] ?? '')
            : isSameAnswerSet(userChoiceAnswer, question.answer);
        const firstOfType = !questions.slice(0, index).some((item) => getEffectiveQuizType(item) === effectiveType);
        const sectionId = firstOfType ? `quiz-section-${effectiveType}` : undefined;

        return (
          <article
            id={sectionId}
            key={question.id}
            className="scroll-mt-4 rounded-md border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="font-semibold leading-7 text-zinc-900 dark:text-white">
                {index + 1}. {question.question}
              </p>
              <span className="rounded-md bg-mint/10 px-2 py-1 text-xs font-semibold text-mint">
                {getQuizTypeLabel(effectiveType, sourceLanguage)}
              </span>
            </div>

            {effectiveType === 'translation' ? (
              <div className="mt-3">
                <textarea
                  className="min-h-24 w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-mint dark:border-white/10 dark:bg-zinc-900"
                  placeholder="请输入对应的原文句子..."
                  value={userTextAnswer}
                  disabled={state.submitted}
                  onChange={(event) => updateText(question.id, event.target.value)}
                />
              </div>
            ) : (
              <fieldset className="mt-3 space-y-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                <legend className="sr-only">{question.question}</legend>
                {question.options.map((option, optionIndex) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 bg-white px-3 py-2 transition hover:border-mint/40 dark:border-white/10 dark:bg-zinc-900"
                  >
                    <input
                      className="mt-1 accent-mint"
                      type={effectiveType === 'single' ? 'radio' : 'checkbox'}
                      name={question.id}
                      value={option}
                      checked={userChoiceAnswer.includes(option)}
                      disabled={state.submitted}
                      onChange={() =>
                        effectiveType === 'single'
                          ? updateSingle(question.id, option)
                          : updateMultiple(question.id, option)
                      }
                    />
                    <span className="font-semibold text-zinc-500">{optionLetters[optionIndex]}.</span>
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>
            )}

            {state.submitted ? (
              <div
                className={`mt-4 rounded-md border px-4 py-3 text-sm leading-6 ${
                  correct
                    ? 'border-mint/30 bg-mint/10 text-zinc-700 dark:text-zinc-200'
                    : 'border-coral/30 bg-coral/10 text-zinc-700 dark:text-zinc-200'
                }`}
              >
                <p className={`flex items-center gap-2 font-semibold ${correct ? 'text-mint' : 'text-coral'}`}>
                  {correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {correct ? 'Correct' : 'Review this one'}
                </p>
                {effectiveType === 'translation' ? (
                  <>
                    <p className="mt-2 whitespace-pre-wrap">Your answer: {userTextAnswer || 'Not answered'}</p>
                    <p className="mt-2 whitespace-pre-wrap">Original sentence: {question.answer[0] || '暂无原文'}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2">Your answer: {choiceLetters(question, userChoiceAnswer) || 'Not answered'}</p>
                    <p>Correct answer: {choiceLetters(question, question.answer)}</p>
                  </>
                )}
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">{question.explanation}</p>
              </div>
            ) : null}
          </article>
        );
      })}

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-md border border-black/10 bg-white/90 p-3 backdrop-blur dark:border-white/10 dark:bg-zinc-900/90 sm:flex-row">
        {state.submitted ? (
          <button
            className="btn-secondary flex-1"
            onClick={() => onChange({ choiceAnswers: {}, textAnswers: {}, submitted: false })}
          >
            <RotateCcw size={16} />
            重新作答
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={() => onChange({ ...state, submitted: true })}>
            <CheckCircle2 size={16} />
            Submit all answers
          </button>
        )}
      </div>
    </div>
  );
}

function choiceLetters(question: QuizQuestion, answer: string[]) {
  return answer
    .map((item) => {
      const index = question.options.findIndex((option) => option === item);
      return index >= 0 ? optionLetters[index] : '';
    })
    .filter(Boolean)
    .join('、');
}

function normalizeTextAnswer(value: string) {
  return value.replace(/\s+/g, '').trim();
}

function getQuizTypeLabel(type: QuizType, sourceLanguage: Language) {
  if (sourceLanguage === 'English') {
    if (type === 'translation') return 'Translation recall';
    return type === 'single' ? 'Single choice' : 'Multiple choice';
  }

  if (type === 'translation') return '翻译题';
  return type === 'single' ? '单选题' : '多选题';
}
