"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

/**
 * 中文输入法（IME）友好的 input。
 *
 * 背景：我们的数据是用 Dexie `useLiveQuery` 响应式的，当用户在打中文拼音时，
 * 父组件每次 keystroke 都会 `saveDaily()` → DB 变化 → 重渲染 → 传回新的 `value`。
 * 如果输入在 composition（中文候选中）期间被外部 `value` 覆盖，已输入的拼音
 * 会被截断 / 清空，打字体验极差。
 *
 * 这个组件：
 *  1. 维持内部 `local` state；
 *  2. composition 进行中时不向上同步、也不被外部 `value` 覆盖；
 *  3. composition 结束（或非 IME 输入）时才调用 `onChange`。
 */

type BaseInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
>;

interface IMEInputProps extends BaseInputProps {
  value: string;
  onChange: (v: string) => void;
  /** IME-aware 的 Enter 回调：在中文候选确认 Enter 时不会触发。 */
  onEnter?: () => void;
}

export const IMEInput = forwardRef<HTMLInputElement, IMEInputProps>(
  function IMEInput(
    { value, onChange, onEnter, onKeyDown, ...rest },
    ref,
  ) {
    const [local, setLocal] = useState(value);
    const composingRef = useRef(false);

    useEffect(() => {
      if (!composingRef.current) setLocal(value);
    }, [value]);

    return (
      <input
        ref={ref}
        {...rest}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          if (!composingRef.current) onChange(e.target.value);
        }}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          composingRef.current = false;
          const v = (e.target as HTMLInputElement).value;
          setLocal(v);
          onChange(v);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (
            onEnter &&
            e.key === "Enter" &&
            !composingRef.current &&
            !(e.nativeEvent as KeyboardEvent).isComposing
          ) {
            e.preventDefault();
            onEnter();
          }
        }}
      />
    );
  },
);

type BaseTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
>;

interface IMETextareaProps extends BaseTextareaProps {
  value: string;
  onChange: (v: string) => void;
}

export const IMETextarea = forwardRef<HTMLTextAreaElement, IMETextareaProps>(
  function IMETextarea({ value, onChange, ...rest }, ref) {
    const [local, setLocal] = useState(value);
    const composingRef = useRef(false);

    useEffect(() => {
      if (!composingRef.current) setLocal(value);
    }, [value]);

    return (
      <textarea
        ref={ref}
        {...rest}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          if (!composingRef.current) onChange(e.target.value);
        }}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          composingRef.current = false;
          const v = (e.target as HTMLTextAreaElement).value;
          setLocal(v);
          onChange(v);
        }}
      />
    );
  },
);
