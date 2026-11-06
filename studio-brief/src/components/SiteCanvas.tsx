import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowRight, Calendar, Clock, FileText, Menu as MenuIcon, MessageCircle,
  Package, Shield, ShoppingBag, Sparkles, Star, Users, X, Zap,
} from 'lucide-react';
import type { Theme } from '../core/theme';
import { mix } from '../core/contrast';
import { SECTIONS } from '../core/catalogs';

export interface CanvasProps {
  theme: Theme;
  copy: { brand: string; title: string; sub: string; cta: string };
  nav: string[];
  sections: string[];
  device: 'desktop' | 'mobile';
  menuOpen?: boolean;
  onMenuToggle?: () => void;
}

const WIDTH = { desktop: 1200, mobile: 375 };

export function SiteCanvas({ theme: t, copy, nav, sections, device, menuOpen = false, onMenuToggle }: CanvasProps) {
  const m = device === 'mobile';
  const pad = m ? Math.round(t.spacing * 0.55) : t.spacing;
  const gutter = m ? 20 : 48;
  const h = (size: number, extra: CSSProperties = {}): CSSProperties => ({
    fontFamily: t.headingFont, fontWeight: t.headingWeight, fontSize: Math.round(size * t.scale * (m ? 0.62 : 1)),
    lineHeight: 1.12, letterSpacing: t.upper ? '0.02em' : '-0.02em', textTransform: t.upper ? 'uppercase' : 'none', margin: 0, color: t.ink, ...extra,
  });
  const body: CSSProperties = { fontFamily: t.bodyFont, color: t.muted, fontSize: m ? 13 : 16, lineHeight: 1.6, margin: 0 };
  const eyebrow: CSSProperties = { fontFamily: t.mono ? 'ui-monospace, Menlo, monospace' : t.bodyFont, fontSize: m ? 10 : 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.primary, fontWeight: 600 };
  const cardStyle: CSSProperties = {
    background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radius,
    boxShadow: t.card === 'elevated' ? `0 10px 24px -14px ${mix(t.ink, t.bg, 0.55)}` : 'none',
  };
  const btn = (primary: boolean): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: m ? '9px 16px' : '13px 24px', borderRadius: t.btnRadius,
    fontFamily: t.bodyFont, fontSize: m ? 12 : 15, fontWeight: 600, cursor: 'pointer',
    background: primary ? t.primary : 'transparent', color: primary ? t.onPrimary : t.ink,
    border: primary ? `1px solid ${t.primary}` : `1px solid ${mix(t.ink, t.bg, 0.6)}`,
  });
  const iconProps = { size: m ? 16 : 22, strokeWidth: t.icons === 'line' ? 1.7 : 1.4, fill: t.icons === 'filled' ? 'currentColor' : 'none', 'aria-hidden': true as const };
  const iconBox = (node: ReactNode): ReactNode => (
    <div style={{ width: m ? 34 : 46, height: m ? 34 : 46, borderRadius: Math.min(t.radius, 14), background: mix(t.bg, t.primary, 0.12), color: t.primary, display: 'grid', placeItems: 'center' }}>{node}</div>
  );
  const Ph = ({ ratio = '4/3', style }: { ratio?: string; style?: CSSProperties }) => (
    <div style={{ aspectRatio: ratio, borderRadius: t.radius, background: mix(t.bg, t.secondary, 0.35), position: 'relative', overflow: 'hidden', ...style }} aria-hidden>
      {t.imagery === 'photos' ? (
        <svg viewBox="0 0 100 70" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <circle cx="76" cy="20" r="8" fill={mix(t.bg, t.primary, 0.25)} />
          <path d="M0 70 L0 48 L22 28 L42 50 L58 34 L100 66 L100 70 Z" fill={mix(t.bg, t.primary, 0.4)} />
          <path d="M0 70 L0 58 L30 44 L56 62 L72 52 L100 70 Z" fill={mix(t.bg, t.primary, 0.62)} />
        </svg>
      ) : (
        <svg viewBox="0 0 100 70" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <circle cx="34" cy="36" r="22" fill={mix(t.bg, t.primary, 0.55)} />
          <rect x="52" y="14" width="30" height="40" rx="10" fill={mix(t.bg, t.accent, 0.7)} />
          <circle cx="70" cy="52" r="9" fill={t.primary} opacity="0.85" />
        </svg>
      )}
    </div>
  );
  const bar = (w: string, hh = 8, c = t.line) => <div style={{ height: hh, width: w, borderRadius: 4, background: c }} />;
  const cols = (n: number) => ({ display: 'grid', gridTemplateColumns: `repeat(${m ? Math.min(n, n > 3 ? 2 : 1) : n}, minmax(0, 1fr))`, gap: m ? 12 : 24 } as CSSProperties);
  const head = (eb: string, title: string, sub?: string) => (
    <div style={{ marginBottom: m ? 18 : 36, maxWidth: 560 }}>
      <div style={eyebrow}>{eb}</div>
      <div style={h(34, { marginTop: 8 })}>{title}</div>
      {sub && <p style={{ ...body, marginTop: 10 }}>{sub}</p>}
    </div>
  );
  const Sec = ({ children, alt = false, id }: { children: ReactNode; alt?: boolean; id: string }) => (
    <section className="sc-sec" data-section={id} style={{ background: alt ? t.surface : 'transparent', borderTop: alt ? `1px solid ${t.line}` : undefined, borderBottom: alt ? `1px solid ${t.line}` : undefined }}>
      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: `${pad}px ${gutter}px` }}>{children}</div>
    </section>
  );

  const items3 = [
    { icon: <Sparkles {...iconProps} />, name: 'Primeiro benefício', txt: 'Uma descrição curta que explica o valor para quem visita.' },
    { icon: <Shield {...iconProps} />, name: 'Segundo benefício', txt: 'Texto de exemplo para mostrar o ritmo e a hierarquia.' },
    { icon: <Zap {...iconProps} />, name: 'Terceiro benefício', txt: 'Conteúdo real será definido junto com você.' },
  ];

  const renderSection = (key: string, i: number) => {
    const alt = i % 2 === 1;
    switch (key) {
      case 'hero': return null;
      case 'about': return (
        <Sec key={key + i} id={key}><div style={{ ...cols(2), alignItems: 'center', gap: m ? 18 : 56 }}>
          <Ph ratio="5/4" />
          <div><div style={eyebrow}>Sobre</div><div style={h(34, { marginTop: 8 })}>Uma história contada com clareza</div>
            <p style={{ ...body, marginTop: 12 }}>Aqui entra o texto institucional. O objetivo é transmitir confiança e proximidade desde as primeiras linhas.</p></div>
        </div></Sec>);
      case 'services': return (
        <Sec key={key + i} id={key} alt={alt}>{head('Serviços', 'O que fazemos por você')}
          <div style={cols(3)}>{items3.map((it) => (
            <div key={it.name} className="sc-card" style={{ ...cardStyle, padding: m ? 14 : 26 }}>{iconBox(it.icon)}
              <div style={h(20, { marginTop: m ? 10 : 18 })}>{it.name}</div><p style={{ ...body, marginTop: 6 }}>{it.txt}</p></div>))}</div></Sec>);
      case 'products': return (
        <Sec key={key + i} id={key} alt={alt}>{head('Produtos', 'Destaques do catálogo')}
          <div style={cols(4)}>{[1, 2, 3, 4].map((n) => (
            <div key={n} className="sc-card" style={{ ...cardStyle, padding: m ? 8 : 12 }}><Ph ratio="1/1" style={{ borderRadius: Math.max(t.radius - 4, 0) }} />
              <div style={{ padding: m ? '8px 4px 4px' : '14px 6px 6px' }}><div style={{ fontFamily: t.bodyFont, fontSize: m ? 11 : 14, fontWeight: 600, color: t.ink }}>Produto {n}</div>
                <div style={{ marginTop: 6 }}>{bar('40%', m ? 6 : 8)}</div>
                <div style={{ ...btn(true), marginTop: m ? 8 : 12, padding: m ? '5px 10px' : '8px 14px', fontSize: m ? 10 : 12 }}><ShoppingBag size={m ? 10 : 14} aria-hidden /> Adicionar</div></div></div>))}</div></Sec>);
      case 'gallery': return (
        <Sec key={key + i} id={key}>{head('Galeria', 'Momentos e detalhes')}
          <div style={cols(3)}>{[0, 1, 2, 3, 4, 5].map((n) => <Ph key={n} ratio={n % 3 === 0 ? '1/1' : '4/3'} />)}</div></Sec>);
      case 'portfolio': return (
        <Sec key={key + i} id={key}>{head('Trabalhos', 'Projetos selecionados')}
          <div style={cols(3)}>{[1, 2, 3].map((n) => (<div key={n} className="sc-card"><Ph ratio="4/5" /><div style={{ fontFamily: t.headingFont, color: t.ink, marginTop: 10, fontSize: m ? 12 : 16, fontWeight: t.headingWeight }}>Projeto {n}</div>{bar('50%', 7)}</div>))}</div></Sec>);
      case 'testimonials': return (
        <Sec key={key + i} id={key} alt={alt}>{head('Depoimentos', 'Quem já passou por aqui')}
          <div style={cols(2)}>{[1, 2].map((n) => (
            <div key={n} className="sc-card" style={{ ...cardStyle, padding: m ? 14 : 28 }}>
              <div style={{ color: t.primary, display: 'flex', gap: 2 }}>{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={m ? 11 : 15} fill="currentColor" aria-hidden />)}</div>
              <p style={{ ...body, color: t.ink, marginTop: 10 }}>“Texto de exemplo de um depoimento, escrito para mostrar como ele aparecerá no site.”</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}><div style={{ width: 30, height: 30, borderRadius: '50%', background: mix(t.bg, t.secondary, 0.6) }} />{bar('90px', 8)}</div></div>))}</div></Sec>);
      case 'faq': return (
        <Sec key={key + i} id={key}>{head('Dúvidas', 'Perguntas frequentes')}
          <div style={{ maxWidth: 700 }}>{['Como funciona o atendimento?', 'Quais formas de contato existem?', 'Em quanto tempo recebo resposta?'].map((q) => (
            <div key={q} style={{ padding: m ? '10px 0' : '18px 0', borderBottom: `1px solid ${t.line}`, display: 'flex', justifyContent: 'space-between', fontFamily: t.bodyFont, fontSize: m ? 12 : 16, color: t.ink, fontWeight: 550 }}>{q}<span style={{ color: t.muted }}>+</span></div>))}</div></Sec>);
      case 'contact': return (
        <Sec key={key + i} id={key} alt={alt}><div style={{ ...cols(2), gap: m ? 18 : 56 }}>
          <div>{head('Contato', 'Vamos conversar?', 'Escolha o melhor canal para falar com a gente.')}
            <div style={{ display: 'grid', gap: 10, ...body }}><span><MessageCircle size={m ? 12 : 16} style={{ verticalAlign: -3 }} aria-hidden /> WhatsApp</span><span><Clock size={m ? 12 : 16} style={{ verticalAlign: -3 }} aria-hidden /> Seg a Sex, 9h às 18h</span></div></div>
          <div className="sc-card" style={{ ...cardStyle, padding: m ? 14 : 28, display: 'grid', gap: m ? 8 : 14 }}>
            {['Nome', 'E-mail', 'Mensagem'].map((f, n) => (<div key={f}><div style={{ ...body, fontSize: m ? 10 : 13, marginBottom: 4 }}>{f}</div><div style={{ height: n === 2 ? (m ? 44 : 84) : (m ? 26 : 42), border: `1px solid ${t.line}`, borderRadius: Math.min(t.radius, 10), background: t.bg }} /></div>))}
            <div style={{ ...btn(true), justifySelf: 'start' }}>Enviar mensagem</div></div></div></Sec>);
      case 'cta': return (
        <section key={key + i} className="sc-sec" data-section={key} style={{ background: t.primary, color: t.onPrimary }}>
          <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: `${pad}px ${gutter}px`, textAlign: 'center' }}>
            <div style={h(36, { color: t.onPrimary })}>Pronto para dar o próximo passo?</div>
            <div style={{ ...btn(false), marginTop: m ? 14 : 24, background: t.onPrimary, color: t.primary, borderColor: t.onPrimary }}>{copy.cta}</div></div></section>);
      case 'steps': return (
        <Sec key={key + i} id={key} alt={alt}>{head('Passo a passo', 'Como funciona')}
          <div style={cols(3)}>{['Você escolhe', 'Nós preparamos', 'Você recebe'].map((s, n) => (
            <div key={s}><div style={{ ...h(40), color: t.primary, opacity: 0.9 }}>0{n + 1}</div><div style={h(20, { marginTop: 6 })}>{s}</div><p style={{ ...body, marginTop: 6 }}>Descrição curta da etapa.</p></div>))}</div></Sec>);
      case 'schedule': return (
        <Sec key={key + i} id={key} alt={alt}><div style={{ ...cols(2), gap: m ? 16 : 48, alignItems: 'start' }}>
          <div>{head('Agendamento', 'Escolha o melhor horário')}<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['09:00', '10:30', '14:00', '16:30'].map((x, n) => (<span key={x} style={{ ...btn(n === 1), padding: m ? '5px 10px' : '8px 16px', fontSize: m ? 10 : 14 }}><Clock size={m ? 10 : 14} aria-hidden />{x}</span>))}</div></div>
          <div className="sc-card" style={{ ...cardStyle, padding: m ? 12 : 22 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, ...body, color: t.ink, fontWeight: 600, marginBottom: 10 }}><Calendar size={m ? 12 : 16} aria-hidden /> Mês</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: m ? 3 : 6 }}>{Array.from({ length: 28 }, (_, n) => (<div key={n} style={{ aspectRatio: '1', borderRadius: Math.min(t.radius, 8), background: n === 12 ? t.primary : n % 5 === 0 ? mix(t.bg, t.primary, 0.12) : t.bg, border: `1px solid ${t.line}` }} />))}</div></div></div></Sec>);
      case 'menu': return (
        <Sec key={key + i} id={key}>{head('Cardápio', 'Pratos da casa')}
          <div style={{ ...cols(2), gap: m ? 10 : 40 }}>{[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderBottom: `1px dotted ${t.line}`, paddingBottom: 10 }}>
              <div style={{ flex: 1 }}><div style={{ fontFamily: t.headingFont, fontWeight: t.headingWeight, fontSize: m ? 13 : 18, color: t.ink }}>Item do cardápio {n}</div>{bar('70%', 7)}</div>{bar('36px', 9, t.secondary)}</div>))}</div></Sec>);
      case 'events': return (
        <Sec key={key + i} id={key} alt={alt}>{head('Programação', 'Dia a dia do evento')}
          {[1, 2, 3].map((n) => (<div key={n} className="sc-card" style={{ ...cardStyle, padding: m ? 10 : 18, display: 'flex', gap: m ? 10 : 20, alignItems: 'center', marginBottom: m ? 8 : 12 }}>
            <div style={{ width: m ? 40 : 64, textAlign: 'center', background: mix(t.bg, t.primary, 0.12), color: t.primary, borderRadius: Math.min(t.radius, 10), padding: m ? '5px 0' : '10px 0', fontFamily: t.headingFont, fontWeight: 700, fontSize: m ? 14 : 22 }}>{`0${n}`}</div>
            <div style={{ flex: 1 }}><div style={{ fontFamily: t.bodyFont, fontWeight: 600, color: t.ink, fontSize: m ? 12 : 16 }}>Atividade {n}</div>{bar('60%', 7)}</div><ArrowRight size={m ? 12 : 18} color={t.muted} aria-hidden /></div>))}</Sec>);
      case 'courses': return (
        <Sec key={key + i} id={key} alt={alt}>{head('Cursos', 'Trilhas de aprendizado')}
          <div style={cols(3)}>{[1, 2, 3].map((n) => (<div key={n} className="sc-card" style={{ ...cardStyle, padding: m ? 10 : 14 }}><Ph ratio="16/10" /><div style={{ padding: m ? '8px 2px' : '14px 4px 4px' }}><div style={{ fontFamily: t.bodyFont, fontWeight: 600, color: t.ink, fontSize: m ? 12 : 15 }}>Curso {n}</div><div style={{ height: 5, borderRadius: 4, background: t.line, marginTop: 10 }}><div style={{ width: `${n * 25}%`, height: '100%', borderRadius: 4, background: t.primary }} /></div></div></div>))}</div></Sec>);
      case 'blog': return (
        <Sec key={key + i} id={key}>{head('Blog', 'Últimas publicações')}
          <div style={cols(3)}>{[1, 2, 3].map((n) => (<div key={n} className="sc-card"><Ph ratio="16/10" /><div style={{ ...eyebrow, marginTop: 10 }}>Categoria</div><div style={h(18, { marginTop: 4 })}>Título do artigo {n}</div>{bar('85%', 7)}</div>))}</div></Sec>);
      case 'stats': return (
        <Sec key={key + i} id={key} alt={alt}><div style={cols(3)}>{['Indicador', 'Indicador', 'Indicador'].map((s, n) => (<div key={n} style={{ textAlign: 'center' }}><div style={h(44, { color: t.primary })}>00</div><div style={body}>{s}</div></div>))}</div></Sec>);
      case 'newsletter': return (
        <Sec key={key + i} id={key} alt={alt}><div className="sc-card" style={{ ...cardStyle, padding: m ? 16 : 40, textAlign: 'center' }}><div style={h(28)}>Receba as novidades</div><div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: m ? 10 : 18 }}><div style={{ width: m ? 120 : 280, height: m ? 30 : 44, border: `1px solid ${t.line}`, borderRadius: t.btnRadius, background: t.bg }} /><div style={btn(true)}>Assinar</div></div></div></Sec>);
      case 'cart': case 'checkout': case 'account': case 'legal': {
        const ic = key === 'legal' ? <FileText {...iconProps} /> : key === 'account' ? <Users {...iconProps} /> : <Package {...iconProps} />;
        return (<Sec key={key + i} id={key}>{head(SECTIONS[key], SECTIONS[key])}<div className="sc-card" style={{ ...cardStyle, padding: m ? 14 : 28, display: 'grid', gap: 10 }}>{iconBox(ic)}{bar('80%')}{bar('60%')}{bar('70%')}</div></Sec>);
      }
      default: return (<Sec key={key + i} id={key}>{head(SECTIONS[key] ?? key, SECTIONS[key] ?? key)}{bar('70%')}</Sec>);
    }
  };

  /* ---- hero ---- */
  const heroBold = t.hero === 'bold';
  const heroBg = heroBold ? t.primary : 'transparent';
  const heroInk = heroBold ? t.onPrimary : t.ink;
  const heroText = (center: boolean) => (
    <div style={{ textAlign: center ? 'center' : 'left', maxWidth: center ? 720 : 520, margin: center ? '0 auto' : 0 }}>
      <div style={{ ...eyebrow, color: heroBold ? t.onPrimary : t.primary }}>{copy.brand}</div>
      <div style={h(t.hero === 'editorial' ? 64 : 56, { marginTop: 12, color: heroInk })}>{copy.title}</div>
      <p style={{ ...body, marginTop: 16, color: heroBold ? mix(t.onPrimary, t.primary, 0.15) : t.muted }}>{copy.sub}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: m ? 16 : 28, justifyContent: center ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
        <span style={heroBold ? { ...btn(false), background: t.onPrimary, color: t.primary, borderColor: t.onPrimary } : btn(true)}>{copy.cta} <ArrowRight size={m ? 12 : 16} aria-hidden /></span>
        {t.hero !== 'minimal' && <span style={heroBold ? { ...btn(false), color: t.onPrimary, borderColor: t.onPrimary } : btn(false)}>Saiba mais</span>}
      </div>
    </div>
  );
  const hero = (
    <section className="sc-sec" data-section="hero" style={{ background: heroBg }}>
      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: `${Math.round(pad * (t.hero === 'minimal' ? 1.5 : 1.1))}px ${gutter}px` }}>
        {t.hero === 'split' || t.hero === 'bold' && !m ? (
          <div style={{ ...cols(2), alignItems: 'center', gap: m ? 18 : 56 }}>{heroText(false)}<Ph ratio="4/3" style={heroBold ? { background: mix(t.primary, t.onPrimary, 0.15) } : undefined} /></div>
        ) : t.hero === 'editorial' ? (
          <div>{heroText(false)}<div style={{ marginTop: m ? 18 : 36 }}><Ph ratio="21/9" /></div></div>
        ) : (
          <div>{heroText(true)}{t.hero !== 'minimal' && <div style={{ marginTop: m ? 18 : 40 }}><Ph ratio={m ? '4/3' : '21/9'} style={heroBold ? { background: mix(t.primary, t.onPrimary, 0.15) } : undefined} /></div>}</div>
        )}
      </div>
    </section>
  );

  const shown = sections.filter((s) => s !== 'hero').slice(0, t.maxSections);
  const navShown = nav.slice(0, m ? 0 : t.menu === 'minimal' ? 3 : 5);
  const logo = <div style={{ fontFamily: t.headingFont, fontWeight: t.headingWeight, color: t.ink, fontSize: m ? 14 : 20, letterSpacing: t.upper ? '0.08em' : '-0.02em', textTransform: t.upper ? 'uppercase' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: m ? 16 : 22, height: m ? 16 : 22, borderRadius: Math.min(t.radius, 8), background: t.primary, display: 'inline-block' }} aria-hidden />{copy.brand}</div>;
  const navLinks = navShown.map((n) => <span key={n} style={{ fontFamily: t.bodyFont, fontSize: 14, color: t.muted }}>{n}</span>);

  const header = (
    <header style={{ position: t.headerFixed ? 'sticky' : 'relative', top: 0, zIndex: 5, background: t.bg, borderBottom: `1px solid ${t.line}`, boxShadow: t.headerFixed ? `0 6px 16px -12px ${mix(t.ink, t.bg, 0.6)}` : 'none' }}>
      <div style={{ maxWidth: t.maxW + 160, margin: '0 auto', padding: `${m ? 12 : 18}px ${gutter}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexDirection: !m && t.menu === 'centered' ? 'column' : 'row' }}>
        {logo}
        {!m && <nav aria-label="Menu simulado" style={{ display: 'flex', gap: 28 }}>{navLinks}</nav>}
        {!m && t.menu !== 'centered' && <span style={{ ...btn(true), padding: '9px 18px', fontSize: 13 }}>{copy.cta}</span>}
        {m && (<button type="button" onClick={onMenuToggle} aria-label={menuOpen ? 'Fechar menu simulado' : 'Abrir menu simulado'} style={{ background: 'none', border: `1px solid ${t.line}`, borderRadius: Math.min(t.radius, 8), color: t.ink, width: 30, height: 30, display: 'grid', placeItems: 'center', padding: 0 }}>{menuOpen ? <X size={16} /> : <MenuIcon size={16} />}</button>)}
      </div>
    </header>
  );

  const mobileMenu = m && menuOpen && (
    <div className="sc-menu" style={{
      position: 'absolute', zIndex: 10, background: t.bg, color: t.ink, borderColor: t.line,
      ...(t.mobileMenu === 'fullscreen' ? { inset: 0, display: 'grid', placeItems: 'center' } : t.mobileMenu === 'bottom' ? { left: 0, right: 0, bottom: 0, padding: 20, borderTop: `1px solid ${t.line}`, borderRadius: `${t.radius}px ${t.radius}px 0 0` } : { top: 0, right: 0, bottom: 0, width: '72%', padding: 20, borderLeft: `1px solid ${t.line}` }),
    }}>
      <div style={{ display: 'grid', gap: 16, textAlign: t.mobileMenu === 'fullscreen' ? 'center' : 'left' }}>
        {(nav.length ? nav : ['Início', 'Contato']).slice(0, 5).map((n) => <span key={n} style={{ fontFamily: t.headingFont, fontWeight: t.headingWeight, fontSize: t.mobileMenu === 'fullscreen' ? 26 : 18 }}>{n}</span>)}
      </div>
    </div>
  );

  const cls = ['sc', `sc-motion-${t.motion}`, `sc-hover-${t.hover}`, `sc-tr-${t.transitions}`].join(' ');
  return (
    <div className={cls} style={{ width: WIDTH[device], background: t.bg, color: t.ink, fontFamily: t.bodyFont, position: 'relative', ['--s-primary' as string]: t.primary }}>
      {header}{mobileMenu}
      {hero}
      {shown.map(renderSection)}
      <footer style={{ borderTop: `1px solid ${t.line}`, padding: `${m ? 18 : 36}px ${gutter}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.surface }}>
        {logo}<span style={{ ...body, fontSize: m ? 10 : 13 }}>Simulação conceitual</span>
      </footer>
    </div>
  );
}

/** Mostra um conteúdo de largura fixa escalado para caber no contêiner. */
export function ScaledFrame({ width, maxHeight, children }: { width: number; maxHeight?: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [innerH, setInnerH] = useState(600);
  useLayoutEffect(() => {
    const o = outer.current!, i = inner.current!;
    const measure = () => { setScale(o.clientWidth / width); setInnerH(i.offsetHeight); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o); ro.observe(i);
    return () => ro.disconnect();
  }, [width]);
  useEffect(() => { /* garante nova medição após fontes carregarem */
    const f = (document as Document & { fonts?: FontFaceSet }).fonts;
    f?.ready.then(() => { if (inner.current) setInnerH(inner.current.offsetHeight); });
  }, []);
  const h = innerH * scale;
  return (
    <div ref={outer} style={{ width: '100%', maxHeight, overflowY: maxHeight ? 'auto' : 'visible', overflowX: 'hidden', position: 'relative' }}>
      <div style={{ height: h, position: 'relative' }}>
        <div ref={inner} style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>{children}</div>
      </div>
    </div>
  );
}
