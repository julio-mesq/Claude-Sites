import type { Project } from '../core/types';

export interface StepProps {
  p: Project;
  set: (fn: (p: Project) => Project) => void;
  meeting: boolean;
  goToStep: (n: number) => void;
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="stack enter" style={{ marginTop: 32 }}>
      <div><h2>{title}</h2>{hint && <p className="muted small" style={{ marginTop: 4 }}>{hint}</p>}</div>
      {children}
    </section>
  );
}
