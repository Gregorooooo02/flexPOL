import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ToolConfirmDialog({ open, onOpenChange, title, description, children, confirmLabel, onConfirm, disabled = false }: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly children?: ReactNode;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly disabled?: boolean;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent initialFocus={cancel} className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        {children}
        <DialogFooter><Button ref={cancel} type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" disabled={disabled} onClick={onConfirm} className="h-auto min-h-10 whitespace-normal">{confirmLabel}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
