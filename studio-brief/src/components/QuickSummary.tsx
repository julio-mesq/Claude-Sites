import { Pencil } from 'lucide-react';
import type { Project } from '../core/types';
import { FEATURES, fontById, paletteById, siteTypeById, styleById } from '../core/catalogs';
import { goalLabels } from '../core/export';
import { Button } from './ui';

export function QuickSummary({ p, onEdit }: { p: Project; onEdit: (step: number) => void }) {
  const rows: { k: string; step: number; v: React.ReactNode }[] = [
    { k: 'Cliente', step: 0, v: [p.client.company, p.client.name].filter(Boolean).join(' · ') || null },
    { k: 'Objetivos', step: 1, v: goalLabels(p).join(', ') || null },
    { k: 'Tipo de site', step: 2, v: siteTypeById(p.siteType)?.name },
    { k: 'Estilo', step: 3, v: styleById(p.style.primary) ? [styleById(p.style.primary)!.name, ...p.style.secondary.map((s) => styleById(s)?.name)].join(' + ') : null },
    { k: 'Cores', step: 4, v: <span className="row-wrap" style={{ gap: 6 }}>{[p.colors.primary, p.colors.secondary, p.colors.accent, p.colors.background].map((c) => <span key={c} className="color-chip"><i style={{ background: c }} />{c}</span>)}<span className="muted small">{paletteById(p.colors.paletteId).name}</span></span> },
    { k: 'Tipografia', step: 5, v: `${fontById(p.typography.heading).name} + ${fontById(p.typography.body).name}` },
    { k: 'Páginas', step: 6, v: p.pages.length ? p.pages.map((x) => x.name).join(', ') : null },
    { k: 'Funcionalidades', step: 7, v: p.features.length ? p.features.map((f) => FEATURES.find((x) => x.id === f)?.name).filter(Boolean).join(', ') : null },
  ];
  return (
    <div>
      {rows.map((r) => (
        <div className="sum-item" key={r.k}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="k">{r.k}</div>
            <div className="v">{r.v || <span className="muted">Ainda não definido</span>}</div>
          </div>
          <Button variant="ghost" size="sm" aria-label={`Editar ${r.k}`} onClick={() => onEdit(r.step)}><Pencil size={13} aria-hidden /> Editar</Button>
        </div>
      ))}
    </div>
  );
}
