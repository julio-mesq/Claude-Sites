import { useState } from 'react';
import { EyeOff } from 'lucide-react';
import { Callout, Segmented, TextArea, TextField } from '../components/ui';
import { isValidEmail, isValidPhone, isValidUrl, maskPhone } from '../core/utils';
import type { StepProps } from './shared';

export function ClientStep({ p, set, meeting }: StepProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const c = p.client;
  const up = (k: keyof typeof c, v: string) => set((q) => ({ ...q, client: { ...q.client, [k]: v } }));
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k: string, bad: boolean, msg: string) => (touched[k] && bad ? msg : null);
  return (
    <div className="stack-lg">
      <div className="grid-2">
        <TextField label="Nome do cliente" value={c.name} onChange={(e) => up('name', e.target.value)} autoComplete="off" placeholder="Como devemos chamar você?" />
        <TextField label="Empresa ou marca" value={c.company} onChange={(e) => up('company', e.target.value)} autoComplete="off" />
        <TextField label="Segmento de atuação" value={c.segment} onChange={(e) => up('segment', e.target.value)} placeholder="Ex.: odontologia, moda, consultoria" />
        <TextField label="Cidade e região de atendimento" value={c.city} onChange={(e) => up('city', e.target.value)} />
        <TextField label="WhatsApp" inputMode="tel" value={c.whatsapp} onChange={(e) => up('whatsapp', maskPhone(e.target.value))} onBlur={blur('wa')}
          error={err('wa', !isValidPhone(c.whatsapp), 'Informe DDD e número, por exemplo (11) 91234-5678.')} />
        <TextField label="E-mail" type="email" value={c.email} onChange={(e) => up('email', e.target.value)} onBlur={blur('em')}
          error={err('em', !isValidEmail(c.email), 'Confira o e-mail digitado.')} />
        <TextField label="Instagram" value={c.instagram} onChange={(e) => up('instagram', e.target.value)} placeholder="@usuario" optional />
        <TextField label="Outras redes" value={c.otherSocial} onChange={(e) => up('otherSocial', e.target.value)} placeholder="LinkedIn, TikTok, YouTube…" optional />
      </div>
      <TextField label="Endereço físico" value={c.address} onChange={(e) => up('address', e.target.value)} optional hint="Deixe em branco se atende apenas online." />
      <TextArea label="Breve descrição do negócio" value={c.description} onChange={(e) => up('description', e.target.value)} placeholder="Em poucas palavras: o que você faz e para quem?" />
      <div className="stack-sm">
        <span className="label" id="has-site">Você já possui um site?</span>
        <div role="group" aria-labelledby="has-site">
          <Segmented label="Possui site" value={c.hasSite || null} onChange={(v) => up('hasSite', v)} options={[{ value: 'yes', label: 'Sim' }, { value: 'no', label: 'Ainda não' }]} />
        </div>
      </div>
      {c.hasSite === 'yes' && (
        <div className="enter"><TextField label="Endereço do site atual" value={c.currentUrl} onChange={(e) => up('currentUrl', e.target.value)} onBlur={blur('url')}
          placeholder="www.seusite.com.br" error={err('url', !isValidUrl(c.currentUrl), 'Esse endereço não parece válido.')} /></div>
      )}
      {!meeting ? (
        <div className="dev-notes stack-sm">
          <div className="row"><EyeOff size={16} aria-hidden /><strong className="small">Anotações privadas do desenvolvedor</strong></div>
          <TextArea label="Visível apenas no modo de edição" value={p.devNotes} onChange={(e) => set((q) => ({ ...q, devNotes: e.target.value }))}
            hint="Ficam ocultas no Modo reunião e fora do PDF e do JSON, a menos que você as inclua de propósito." />
        </div>
      ) : (
        <Callout>As anotações privadas ficam ocultas durante a apresentação ao cliente.</Callout>
      )}
    </div>
  );
}
