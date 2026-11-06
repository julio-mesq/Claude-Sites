import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
  type ButtonHTMLAttributes, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle, Check, CheckCircle2, Info, X } from 'lucide-react';

/* ---------- Botão ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'ghost' | 'danger' | 'danger-solid'; size?: 'sm' | 'md' | 'lg' };
export function Button({ variant = 'default', size = 'md', className = '', type = 'button', ...rest }: BtnProps) {
  const v = variant === 'default' ? '' : ` btn-${variant}`;
  const s = size === 'md' ? '' : ` btn-${size}`;
  return <button type={type} className={`btn${v}${s} ${className}`} {...rest} />;
}

export function IconButton({ label, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} title={label} className={`btn btn-ghost icon-btn ${className}`} {...rest}>{children}</button>;
}

/* ---------- Campos ---------- */
interface FieldShell { label: string; hint?: string; error?: string | null; optional?: boolean; className?: string }

export function TextField({ label, hint, error, optional, className = '', ...rest }: FieldShell & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}{optional && <span className="muted"> · opcional</span>}</label>
      <input id={id} className="input" aria-invalid={!!error} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...rest} />
      {error ? <span id={`${id}-e`} className="field-error" role="alert">{error}</span> : hint ? <span id={`${id}-h`} className="hint">{hint}</span> : null}
    </div>
  );
}

export function TextArea({ label, hint, error, optional, className = '', ...rest }: FieldShell & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}{optional && <span className="muted"> · opcional</span>}</label>
      <textarea id={id} className="textarea" aria-invalid={!!error} {...rest} />
      {error ? <span className="field-error" role="alert">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function SelectField({ label, children, className = '', hint, ...rest }: { label: string; hint?: string; className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <select id={id} className="select" {...rest}>{children}</select>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/* ---------- Seleção ---------- */
export function Chip({ selected, onClick, children, role }: { selected: boolean; onClick: () => void; children: ReactNode; role?: 'radio' }) {
  return role === 'radio'
    ? <button type="button" role="radio" aria-checked={selected} className="chip" onClick={onClick}>{children}</button>
    : <button type="button" aria-pressed={selected} className="chip" onClick={onClick}>{selected && <Check aria-hidden />}{children}</button>;
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T | null; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function ChoiceCard({ selected, onClick, title, desc, children, multi = false, leading }: {
  selected: boolean; onClick: () => void; title: ReactNode; desc?: ReactNode; children?: ReactNode; multi?: boolean; leading?: ReactNode;
}) {
  const props = multi ? { 'aria-pressed': selected } : { role: 'radio' as const, 'aria-checked': selected };
  return (
    <button type="button" className="choice" onClick={onClick} {...props}>
      {leading}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="choice-title">{title}</span>
        {desc && <span className="choice-desc" style={{ display: 'block' }}>{desc}</span>}
        {children}
      </span>
      <span className="check" aria-hidden><Check /></span>
    </button>
  );
}

export function SliderField({ id, left, right, value, onChange }: { id: string; left: string; right: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="stack-sm">
      <div className="row small" style={{ justifyContent: 'space-between' }}>
        <label htmlFor={id} className={value < 45 ? '' : 'muted'} style={{ fontWeight: value < 45 ? 600 : 400 }}>{left}</label>
        <label htmlFor={id} className={value > 55 ? '' : 'muted'} style={{ fontWeight: value > 55 ? 600 : 400 }}>{right}</label>
      </div>
      <input id={id} type="range" min={0} max={100} step={5} value={value} className="range" style={{ ['--fill' as string]: `${value}%` }}
        aria-valuetext={value < 45 ? left : value > 55 ? right : 'Equilibrado'} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
      <span className="track" aria-hidden /> <span>{label}</span>
    </button>
  );
}

/* ---------- Feedback ---------- */
export function Callout({ kind = 'info', children, action }: { kind?: 'info' | 'warn' | 'err' | 'ok'; children: ReactNode; action?: ReactNode }) {
  const Icon = kind === 'ok' ? CheckCircle2 : kind === 'info' ? Info : AlertCircle;
  return (
    <div className={`callout ${kind === 'info' ? '' : kind}`} role={kind === 'err' ? 'alert' : undefined}>
      <Icon size={18} aria-hidden />
      <div style={{ flex: 1 }}>{children}</div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ico" aria-hidden>{icon}</div>
      <h3>{title}</h3>
      <p className="muted small" style={{ margin: '6px auto 18px', maxWidth: 380 }}>{text}</p>
      {action}
    </div>
  );
}

export function Spinner({ label = 'Carregando' }: { label?: string }) {
  return <div role="status" aria-label={label} className="spinner" />;
}

export function Badge({ children, kind }: { children: ReactNode; kind?: 'ok' | 'warn' | 'ink' }) {
  return <span className={`badge${kind ? ` badge-${kind}` : ''}`}>{children}</span>;
}

/* ---------- Modal ---------- */
export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current!;
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((x) => !x.hasAttribute('disabled'));
    (focusables()[0] ?? el).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {
        const f = focusables(); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="row" style={{ marginBottom: 12 }}>
          <h2 id={titleId} style={{ flex: 1 }}>{title}</h2>
          <IconButton label="Fechar" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="stack">{children}</div>
        {footer && <div className="row" style={{ justifyContent: 'flex-end', marginTop: 22, flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, text, confirmLabel, danger, onConfirm, onClose }: {
  title: string; text: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} footer={<>
      <Button onClick={onClose}>Cancelar</Button>
      <Button variant={danger ? 'danger-solid' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
    </>}>
      <p className="muted">{text}</p>
    </Modal>
  );
}

export function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <>
      <div className="overlay" style={{ background: 'rgba(20,23,28,0.25)', placeItems: 'stretch' }} onMouseDown={onClose} />
      <aside className="drawer" role="dialog" aria-label={title}>
        <div className="row" style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)' }}>
          <h2 style={{ flex: 1 }}>{title}</h2>
          <IconButton label="Fechar" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </>
  );
}

/* ---------- Toasts ---------- */
interface ToastItem { id: number; msg: string; kind: 'ok' | 'err' | 'info' }
const ToastCtx = createContext<(msg: string, kind?: ToastItem['kind']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((msg: string, kind: ToastItem['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, msg, kind }]);
    window.setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3600);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'err' ? 'alert' : 'status'}>
            {t.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Menu suspenso simples e acessível por teclado. */
export function Menu({ trigger, children, label }: { trigger: ReactNode; children: (close: () => void) => ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="btn btn-ghost icon-btn" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{trigger}</button>
      {open && <div className="menu-pop" role="menu">{children(() => setOpen(false))}</div>}
    </div>
  );
}
