"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Modal } from "./modal";
import { Button } from "./button";

type ConfirmOpts = { title: string; description?: ReactNode; confirmLabel?: string; danger?: boolean };
const Ctx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);

/** Provedor de confirmação para ações destrutivas. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<(v: boolean) => void>(undefined);
  const confirm = useCallback((o: ConfirmOpts) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => (resolver.current = resolve));
  }, []);
  const close = (v: boolean) => {
    resolver.current?.(v);
    setOpts(null);
  };
  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal
        open={!!opts}
        onClose={() => close(false)}
        title={opts?.title ?? ""}
        description={opts?.description}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button variant={opts?.danger ? "danger" : "primary"} onClick={() => close(true)}>
              {opts?.confirmLabel ?? "Confirmar"}
            </Button>
          </>
        }
      />
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);
