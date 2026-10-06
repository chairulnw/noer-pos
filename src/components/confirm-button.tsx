"use client";

import { useRef } from "react";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";

export function ConfirmButton({ message, confirmLabel = "Ya, lanjutkan", onConfirm, ...props }: React.ComponentProps<typeof Button> & { message: string; confirmLabel?: string; onConfirm?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button type="button" {...props} ref={button} onClick={() => dialog.current?.showModal()} />
      <Modal dialogRef={dialog}>
        <p className="text-[14px] font-medium">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>Batal</Button>
          <Button
            type="button"
            variant={props.variant === "destructive" ? "destructive" : "default"}
            onClick={() => {
              dialog.current?.close();
              if (onConfirm) return onConfirm();
              const form = button.current?.form;
              if (!form) return;
              const submitter = document.createElement("button");
              submitter.type = "submit";
              submitter.hidden = true;
              if (props.name) { submitter.name = props.name; submitter.value = String(props.value ?? ""); }
              form.append(submitter);
              form.requestSubmit(submitter);
              submitter.remove();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
