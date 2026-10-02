import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  triggerLabel: string;
  children: ReactNode;
}

export function Modal({ title, triggerLabel, children }: ModalProps) {
  const [open, setOpen] = useState<boolean>(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus close button when modal opens.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open ]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open ]);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      {open ? (
        <div role="dialog" aria-modal="true" aria-label={title}>
          <div role="presentation" onClick={() => setOpen(false)} />
          <div>
            <h2>{title}</h2>
            <div>{children}</div>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
