import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PromptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
}

export function PromptDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  placeholder,
  defaultValue = "",
  confirmLabel = "Criar",
  cancelLabel = "Cancelar",
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/10 bg-slate-950/90 text-slate-100 max-w-md backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-foreground">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="bg-white/5 border-white/10 text-xs h-9 focus-visible:ring-primary/50 text-foreground"
            autoFocus
          />
          <DialogFooter className="flex gap-2 justify-end sm:space-x-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 hover:bg-white/5 text-muted-foreground hover:text-slate-200 cursor-pointer"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={!value.trim()}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-medium text-xs h-8 px-4 cursor-pointer"
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  isDestructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/10 bg-slate-950/90 text-slate-100 max-w-md backdrop-blur-xl">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-sm font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end sm:space-x-0 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 hover:bg-white/5 text-muted-foreground hover:text-slate-200 cursor-pointer"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={cn(
              "font-medium text-xs h-8 px-4 cursor-pointer",
              isDestructive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-primary hover:bg-primary/95 text-primary-foreground"
            )}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
