import { cloneElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** The props `Field` sets on its control. */
interface ControlProps {
  id?: string;
  placeholder?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * Control with its label floating inside, and a hint or error underneath.
 *
 * The label rests in the middle of an empty text control and moves to the
 * top strip on focus or content (`.floating-field` in `globals.css`). Date
 * inputs and selects always show something, so their label stays up.
 * `:placeholder-shown` needs a placeholder, so one is added when missing.
 */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: string;
  error?: string;
  children: ReactElement<ControlProps>;
  className?: string;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="floating-field">
        {cloneElement(children, {
          id,
          placeholder: children.props.placeholder ?? ' ',
          'aria-invalid': error ? true : undefined,
          'aria-describedby': note ? noteId : undefined,
        })}
        <label htmlFor={id}>{label}</label>
      </div>
      {note && (
        <p id={noteId} className={cn('text-xs', error ? 'text-error' : 'text-on-surface-variant')}>
          {note}
        </p>
      )}
    </div>
  );
}

/** Classes shared by `<input>` and `<select>`: 44 px tall, with the top strip kept for the label. */
export const controlClass = cn(
  'h-11 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 pt-4 text-sm text-on-surface',
  'transition-colors duration-150 outline-none hover:border-outline focus:border-secondary',
  'aria-invalid:border-error',
);
