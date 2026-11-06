import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Button, Modal, TextField, useToast } from './ui';
import { useStore } from '../core/store';

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, setProfile } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState(profile);
  const [err, setErr] = useState<string | null>(null);
  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g|svg\+xml|webp)$/.test(f.type)) { setErr('Use uma imagem PNG, JPG, SVG ou WebP.'); return; }
    if (f.size > 150_000) { setErr('A imagem deve ter até 150 KB.'); return; }
    const r = new FileReader();
    r.onload = () => { setErr(null); setDraft((d) => ({ ...d, logo: String(r.result) })); };
    r.onerror = () => setErr('Não foi possível ler a imagem.');
    r.readAsDataURL(f);
  };
  return (
    <Modal title="Perfil do profissional" onClose={onClose} footer={<>
      <Button onClick={onClose}>Cancelar</Button>
      <Button variant="primary" onClick={() => { const e = setProfile(draft); if (e) setErr(e); else { toast('Perfil salvo neste navegador'); onClose(); } }}>Salvar</Button>
    </>}>
      <p className="muted small">Aparece na capa do PDF e na impressão. Fica salvo apenas neste navegador.</p>
      <TextField label="Nome ou estúdio" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <TextField label="Contato ou frase de apoio" optional value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} placeholder="E-mail, site ou WhatsApp" />
      <div className="stack-sm">
        <span className="label">Logotipo <span className="muted">· opcional</span></span>
        <div className="row">
          {draft.logo ? <img src={draft.logo} alt="Logotipo atual" style={{ height: 44, maxWidth: 140, objectFit: 'contain', border: '1px solid var(--line)', borderRadius: 8, padding: 4 }} /> : null}
          <label className="btn btn-sm" style={{ cursor: 'pointer' }}><ImagePlus size={14} aria-hidden /> {draft.logo ? 'Trocar' : 'Enviar imagem'}
            <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} /></label>
          {draft.logo && <Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, logo: '' })}><Trash2 size={14} aria-hidden /> Remover</Button>}
        </div>
        {err && <span className="field-error" role="alert">{err}</span>}
      </div>
    </Modal>
  );
}
