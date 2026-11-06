import { describe, expect, it } from 'vitest';
import { bestOn, checkContrast, contrastRatio, fixContrast, normalizeHex } from './contrast';
import { newProject } from './defaults';
import { exportEnvelope, summaryText } from './export';
import { applySiteType, consistency, pendencies, recommend } from './rules';
import { normalizeProject, parseImport } from './validation';
import { emptyProfile } from './defaults';
import { isValidEmail, isValidPhone, isValidUrl, maskPhone, move } from './utils';

describe('contraste', () => {
  it('calcula razões WCAG conhecidas', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeGreaterThan(4.4);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeLessThan(4.6);
  });
  it('normaliza HEX e rejeita inválidos', () => {
    expect(normalizeHex('abc')).toBe('#AABBCC');
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('zzzzzz')).toBeNull();
  });
  it('escolhe texto legível e corrige contraste', () => {
    expect(bestOn('#111111')).toBe('#FFFFFF');
    expect(bestOn('#FAFAFA')).toBe('#14171C');
    const fixed = fixContrast('#CCCCCC', '#FFFFFF', 3);
    expect(contrastRatio(fixed, '#FFFFFF')).toBeGreaterThanOrEqual(3);
  });
  it('reprova combinações fracas', () => {
    const r = checkContrast({ primary: '#EEEEEE', secondary: '#EEEEEE', background: '#FFFFFF', ink: '#20242B', onPrimary: '#FFFFFF' });
    expect(r.find((c) => c.id === 'button')?.pass).toBe(false);
  });
});

describe('regras', () => {
  it('aplica páginas padrão ao escolher o tipo, sem sobrescrever personalizações', () => {
    let p = applySiteType(newProject(), 'store');
    expect(p.pages.map((x) => x.key)).toContain('cart');
    expect(p.homeId).toBe(p.pages[0].id);
    p = { ...p, pages: [...p.pages, { id: 'x', key: 'custom', name: 'Equipe', sections: ['about'] }] };
    const q = applySiteType(p, 'blog');
    expect(q.pages.some((x) => x.name === 'Equipe')).toBe(true);
  });
  it('landing page vira uma página única com seções', () => {
    const p = applySiteType(newProject(), 'landing');
    expect(p.pages).toHaveLength(1);
    expect(p.pages[0].sections.length).toBeGreaterThan(2);
  });
  it('sugere páginas coerentes com as funcionalidades e a LGPD', () => {
    let p = applySiteType(newProject(), 'institutional');
    p = { ...p, features: ['blog', 'contact-form'] };
    const ids = consistency(p).map((s) => s.id);
    expect(ids).toContain('page-blog');
    expect(ids).toContain('page-privacy');
    const fixed = consistency(p)[0].apply(p);
    expect(fixed.pages.length).toBe(p.pages.length + 1);
  });
  it('recomendações só alteram dados quando aplicadas', () => {
    const p = newProject();
    const r = recommend({ ...p, client: { ...p.client, segment: 'Restaurante' } }, 'style');
    expect(r?.title).toBe('Acolhedor');
    expect(p.style.primary).toBeNull();
  });
  it('lista pendências de um projeto vazio e as reduz ao preencher', () => {
    const empty = pendencies(newProject()).length;
    const p = newProject();
    p.client.name = 'A'; p.client.company = 'B'; p.client.email = 'a@b.co';
    expect(pendencies(p).length).toBeLessThan(empty);
  });
});

describe('importação e exportação', () => {
  it('faz round-trip do JSON e remove notas por padrão', () => {
    const p = applySiteType(newProject(), 'portfolio');
    p.client.company = 'Studio X'; p.devNotes = 'segredo';
    const env = exportEnvelope(p, false);
    expect(env.project.devNotes).toBe('');
    const res = parseImport(JSON.stringify(exportEnvelope(p, true)));
    expect(res.ok && res.project.client.company).toBe('Studio X');
    expect(res.ok && res.project.devNotes).toBe('segredo');
  });
  it('rejeita arquivos inválidos com mensagem clara', () => {
    expect(parseImport('não é json').ok).toBe(false);
    expect(parseImport('{"foo":1}').ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: 'studio-brief', schemaVersion: 99, project: {} })).ok).toBe(false);
  });
  it('sanitiza dados corrompidos', () => {
    const p = normalizeProject({ id: 5, status: 'xyz', currentStep: 99, colors: { primary: 'azul' }, pages: [null, { name: 3 }], features: 'x', style: { sliders: { detail: 400 } } });
    expect(p.status).toBe('progress');
    expect(p.currentStep).toBe(5);
    expect(p.colors.primary).toMatch(/^#[0-9A-F]{6}$/i);
    expect(p.style.sliders.detail).toBe(100);
    expect(p.features).toEqual([]);
    expect(p.pages).toHaveLength(1);
  });
  it('resumo em texto não vaza anotações sem autorização', () => {
    const p = newProject(); p.devNotes = 'confidencial';
    expect(summaryText(p, emptyProfile())).not.toContain('confidencial');
    expect(summaryText(p, emptyProfile(), true)).toContain('confidencial');
  });
});

describe('utilitários', () => {
  it('valida contatos', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidPhone('(11) 91234-5678')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
    expect(isValidUrl('www.exemplo.com.br')).toBe(true);
    expect(isValidUrl('isso nao')).toBe(false);
    expect(maskPhone('11912345678')).toBe('(11) 91234-5678');
  });
  it('reordena listas sem mutar', () => {
    const a = [1, 2, 3];
    expect(move(a, 0, 2)).toEqual([2, 3, 1]);
    expect(a).toEqual([1, 2, 3]);
  });
});
