'use client';

import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Language, QuizQuestion } from '../../types';
import { isSameAnswerSet } from './studyUtils';

interface QuizPageProps {
  questions: QuizQuestion[];
  sourceLanguage: Language;
}

export function QuizPage({ questions, sourceLanguage }: QuizPageProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [questions]);

  const score = useMemo(
    () => questions.filter((question) => isSameAnswerSet(answers[question.id] ?? [], question.answer)).length,
    [answers, questions],
  );

  const updateSingle = (questionId: string, option: string) => {
    setAnswers((current) => ({ ...current, [questionId]: [option] }));
  };

  const updateMultiple = (questionId: string, option: string) => {
    setAnswers((current) => {
      const selected = current[questionId] ?? [];
      return {
        ...current,
        [questionId]: selected.includes(option)
          ? selected.filter((item) => item !== option)
          : [...selected, option],
      };
    });
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
      {submitted ? (
        <div className="sticky top-0 z-10 rounded-md border border-mint/30 bg-mint/10 p-4 text-sm font-semibold text-mint backdrop-blur">
          得分：{score} / {questions.length}
        </div>
      ) : null}

      {questions.map((question, index) => {
        const userAnswer = answers[question.id] ?? [];
        const correct = isSameAnswerSet(userAnswer, question.answer);

        return (
          <article key={question.id} className="rounded-md border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="font-semibold leading-7 text-zinc-900 dark:text-white">
                {index + 1}. {question.question}
              </p>
              <span className="rounded-md bg-mint/10 px-2 py-1 text-xs font-semibold text-mint">
                {getQuizTypeLabel(question.type, sourceLanguage)}
              </span>
            </div>

            <fieldset className="mt-3 space-y-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
              <legend className="sr-only">{question.question}</legend>
              {question.options.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 bg-white px-3 py-2 transition hover:border-mint/40 dark:border-white/10 dark:bg-zinc-900"
                >
                  <input
                    className="mt-1 accent-mint"
                    type={question.type === 'single' ? 'radio' : 'checkbox'}
                    name={question.id}
                    value={option}
                    checked={userAnswer.includes(option)}
                    disabled={submitted}
                    onChange={() =>
                      question.type === 'single'
                        ? updateSingle(question.id, option)
                        : updateMultiple(question.id, option)
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>

            {submitted ? (
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
                <p className="mt-2">Your answer: {userAnswer.length ? userAnswer.join('、') : 'Not answered'}</p>
                <p>Correct answer: {question.answer.join('、')}</p>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">{question.explanation}</p>
              </div>
            ) : null}
          </article>
        );
      })}

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-md border border-black/10 bg-white/90 p-3 backdrop-blur dark:border-white/10 dark:bg-zinc-900/90 sm:flex-row">
        {submitted ? (
          <button
            className="btn-secondary flex-1"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            <RotateCcw size={16} />
            重新作答
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={() => setSubmitted(true)}>
            <CheckCircle2 size={16} />
            Submit all answers
          </button>
        )}
      </div>
    </div>
  );
}

function getQuizTypeLabel(type: QuizQuestion['type'], sourceLanguage: Language) {
  if (sourceLanguage === 'English') {
    return type === 'single' ? 'Single choice' : 'Multiple choice';
  }

  return type === 'single' ? '单选题' : '多选题';
}
