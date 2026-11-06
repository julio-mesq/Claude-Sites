import { Plus, Trash2 } from 'lucide-react';
import { Button, Callout, Chip, Segmented, TextArea, TextField } from '../components/ui';
import { CONTENT_ITEMS, REF_LIKES } from '../core/catalogs';
import { isValidUrl, toggle, uid } from '../core/utils';
import { Section, type StepProps } from './shared';

export function ContentStep({ p, set }: StepProps) {
  const c = p.content;
  const setHas = (id: string, v: 'yes' | 'partial' | 'no') => set((q) => ({ ...q, content: { ...q.content, has: { ...q.content.has, [id]: v } } }));
  const upRef = (id: string, patch: Partial<(typeof c.refs)[number]>) => set((q) => ({ ...q, content: { ...q.content, refs: q.content.refs.map((r) => (r.id === id ? { ...r, ...patch } : r)) } }));
  return (
    <div>
      <div className="card" style={{ padding: '6px 18px' }}>
        {CONTENT_ITEMS.map((it) => (
          <div className="has-row" key={it.id}>
            <span>{it.label}</span>
            <Segmented label={it.label} value={c.has[it.id] ?? null} onChange={(v) => setHas(it.id, v)} options={[{ value: 'yes', label: 'Tenho' }, { value: 'partial', label: 'Em parte' }, { value: 'no', label: 'Não tenho' }]} />
          </div>
        ))}
      </div>
      <Section title="Sites de referência" hint="Sites que você admira. Usamos apenas como inspiração; nenhum conteúdo é copiado.">
        {c.refs.map((r, i) => (
          <div key={r.id} className="card stack enter">
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <TextField className="spacer" label={`Referência ${i + 1}`} value={r.url} placeholder="www.exemplo.com.br" onChange={(e) => upRef(r.id, { url: e.target.value })} error={r.url && !isValidUrl(r.url) ? 'Esse endereço não parece válido.' : null} />
              <Button variant="ghost" aria-label={`Remover referência ${i + 1}`} onClick={() => set((q) => ({ ...q, content: { ...q.content, refs: q.content.refs.filter((x) => x.id !== r.id) } }))}><Trash2 size={16} /></Button>
            </div>
            <div className="stack-sm"><span className="label">O que você gostou?</span>
              <div className="chips">{REF_LIKES.map((l) => <Chip key={l} selected={r.likes.includes(l)} onClick={() => upRef(r.id, { likes: toggle(r.likes, l) })}>{l}</Chip>)}</div></div>
            <TextField label="Observação" optional value={r.note} onChange={(e) => upRef(r.id, { note: e.target.value })} />
          </div>
        ))}
        <div><Button onClick={() => set((q) => ({ ...q, content: { ...q.content, refs: [...q.content.refs, { id: uid(), url: '', likes: [], note: '' }] } }))}><Plus size={14} aria-hidden /> Adicionar referência</Button></div>
      </Section>
      <Section title="Materiais">
        <TextArea label="O que ainda precisará ser produzido?" value={c.toProduce} onChange={(e) => set((q) => ({ ...q, content: { ...q.content, toProduce: e.target.value } }))} placeholder="Ex.: fotos profissionais, textos da página Sobre, logotipo" />
        <TextField label="Link para os materiais já existentes" optional value={c.materialsLink} onChange={(e) => set((q) => ({ ...q, content: { ...q.content, materialsLink: e.target.value } }))} placeholder="Pasta no Google Drive, Dropbox…" error={c.materialsLink && !isValidUrl(c.materialsLink) ? 'Esse endereço não parece válido.' : null} />
        <Callout>Envio de arquivos não está disponível: esta versão guarda dados apenas neste navegador, que não é um lugar confiável para arquivos grandes. Use o link acima.</Callout>
      </Section>
    </div>
  );
}
