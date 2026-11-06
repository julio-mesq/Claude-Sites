// Teste de ponta a ponta do fluxo completo (Playwright + build de produção).
import { chromium } from 'playwright';
import { spawn, execSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = 4179;
const URL = `http://localhost:${PORT}/`;
const OUT = process.env.E2E_OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'sb-e2e-'));
fs.mkdirSync(OUT, { recursive: true });

if (!process.env.E2E_NO_BUILD) execSync('npm run build', { stdio: 'inherit' });
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(URL)).ok) break; } catch { /* aguardando */ } await new Promise((r) => setTimeout(r, 200)); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });

let n = 0;
const step = async (name, fn) => { n++; process.stdout.write(`${String(n).padStart(2, '0')} ${name} ... `); await fn(); console.log('ok'); };
const next = () => page.getByRole('button', { name: /Avançar/ }).click();
const back = () => page.getByRole('button', { name: /Voltar/ }).first().click();
const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

try {
  await step('tela inicial vazia', async () => {
    await page.goto(URL);
    await page.getByText('Nenhum projeto ainda').waitFor();
    await shot('01-home-vazia');
  });

  await step('novo projeto abre boas-vindas e começa a jornada', async () => {
    await page.getByRole('button', { name: /Novo projeto/ }).first().click();
    await page.getByRole('heading', { name: /Vamos desenhar o seu site/ }).waitFor();
    await page.getByRole('button', { name: /Começar/ }).click();
    await page.getByLabel('Nome do cliente').waitFor();
  });

  await step('etapa 1: validação de campos e dados do cliente', async () => {
    await page.getByLabel('E-mail').fill('errado');
    await page.getByLabel('E-mail').blur();
    await page.getByText('Confira o e-mail digitado.').waitFor();
    await page.getByLabel('E-mail').fill('marina@atelier.com.br');
    await page.getByLabel('Nome do cliente').fill('Marina Duarte');
    await page.getByLabel('Empresa ou marca').fill('Atelier Norte');
    await page.locator('.preview-col').getByText('Atelier Norte').first().waitFor(); // prévia já mostra o nome
    await page.getByLabel('Cidade e região de atendimento').fill('Curitiba');
    await page.locator('.preview-col').getByText(/Curitiba/).first().waitFor();
    await page.getByLabel('Segmento de atuação').fill('Arquitetura');
    await page.getByLabel('WhatsApp').fill('11912345678');
    assert.equal(await page.getByLabel('WhatsApp').inputValue(), '(11) 91234-5678');
    await page.getByRole('radio', { name: 'Sim' }).click();
    await page.getByLabel('Endereço do site atual').fill('www.ateliernorte.com.br');
    await page.getByLabel('Visível apenas no modo de edição').fill('Cliente quer entrega antes de março. NOTA-SECRETA');
  });

  await step('mesma tela: objetivos múltiplos e perguntas complementares', async () => {
    await page.getByRole('button', { name: /Apresentar meus serviços/ }).click();
    await page.getByRole('button', { name: /Conseguir novos clientes/ }).click();
    await page.getByLabel('Quem é o seu público-alvo?').fill('Famílias que vão reformar a casa');
    await page.getByRole('button', { name: 'Chamar no WhatsApp' }).click();
  });

  await step('etapa 3: tipo de site mostra prévia de estrutura', async () => {
    await next();
    await page.getByRole('radio', { name: /Site de agendamentos/ }).click();
    await page.getByText('Como esse tipo de site funciona').waitFor();
    await page.getByRole('radio', { name: /Landing page/ }).click();
    await page.getByRole('radio', { name: /Site institucional/ }).click();
    await shot('03-tipo');
  });

  await step('mesma tela: estilo, característica secundária e sliders', async () => {
    await page.getByRole('radio', { name: /Elegante/ }).click();
    await page.getByRole('button', { name: 'Acolhedor' }).click();
    const sl = page.locator('#sl-presence');
    await sl.focus(); for (let i = 0; i < 6; i++) await sl.press('ArrowRight');
    await page.getByRole('button', { name: /Aplicar/ }).first().click(); // paleta e fontes sugeridas
    await shot('04-estilo');
  });

  await step('etapa 5: paleta, HEX personalizado, contraste e tema escuro', async () => {
    await next();
    await page.getByRole('radio', { name: /Verde natural/ }).click();
    const hex = page.getByLabel('Código HEX: Cor principal');
    await hex.fill('#EEEEEE');
    await page.getByText(/Abaixo de 3:1/).first().waitFor(); // cor principal clara demais sobre o fundo
    await hex.fill('#1F5F8B');
    assert.equal(await hex.inputValue(), '#1F5F8B');
    await page.waitForFunction(() => [...document.querySelectorAll('.preview-col [data-section="hero"] span')].some((e) => getComputedStyle(e).backgroundColor === 'rgb(31, 95, 139)')); // prévia muda de cor
    await hex.fill('zzz'); await page.getByText('Use o formato #RRGGBB.').waitFor();
    await hex.fill('#1F5F8B');
    await page.getByRole('radio', { name: 'Escuro', exact: true }).click();
    await page.getByRole('button', { name: 'Aplicar combinação Complementar' }).click();
    await page.getByRole('radio', { name: 'Claro', exact: true }).click();
    await shot('05-cores');
  });

  await step('mesma tela: tipografia', async () => {
    await page.getByRole('radio', { name: 'Tradicional', exact: true }).click();
    await page.getByRole('radio', { name: /Editorial clássica/ }).click();
    await page.getByRole('radio', { name: 'Forte', exact: true }).click();
    await page.getByLabel('Fonte dos textos').selectOption('manrope');
    await shot('06-fontes');
  });

  await step('etapa 7: páginas — renomear, reordenar, principal, adicionar, mapa', async () => {
    await next();
    const name = page.getByLabel('Nome da página 2');
    await name.fill('Nossos serviços');
    await page.getByRole('button', { name: 'Subir Nossos serviços' }).click();
    assert.equal(await page.getByLabel('Nome da página 1').inputValue(), 'Nossos serviços');
    await page.getByRole('button', { name: /Principal/ }).nth(1).click();
    await page.getByRole('button', { name: 'Adicionar Portfólio' }).or(page.getByRole('button', { name: /Portfólio/ })).first().click();
    await page.getByLabel('Página personalizada').fill('Nossa equipe');
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await page.getByLabel('Nome da página 6').waitFor();
    await page.getByRole('button', { name: /Definir seções de Nossa equipe/ }).click();
    await page.getByRole('button', { name: /Galeria/ }).last().click();
    await page.getByRole('img', { name: /Mapa de navegação/ }).waitFor();
    await shot('07-paginas');
  });

  await step('mesma tela: funcionalidades, sugestões coerentes e demonstração', async () => {
    await page.getByRole('button', { name: /Aplicar/ }).first().click();
    await page.getByRole('button', { name: /Botão do WhatsApp/ }).waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.preview-col [data-section="hero"] span')].some((e) => getComputedStyle(e).backgroundColor === 'rgb(31, 157, 85)')); // botão do WhatsApp aparece na prévia
    await page.locator('button.feature', { hasText: 'Blog' }).first().click(); // marca blog
    await page.getByText(/ainda não há a página “Blog”/).waitFor();
    await shot('08-features');
  });

  await step('etapa 9: aparência — padrão do estilo, escolha própria e retorno', async () => {
    await next();
    await page.getByText('Sugerido pelo estilo').first().waitFor();
    await page.getByRole('radio', { name: 'Retos', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar ao sugerido' }).first().click();
    await page.getByRole('radio', { name: 'Fixo ao rolar' }).click();
  });

  await step('mesma tela: conteúdo e referências', async () => {
    await page.getByRole('radio', { name: 'Tenho' }).first().click();
    await page.getByRole('radio', { name: 'Não tenho' }).nth(3).click();
    await page.getByRole('button', { name: /Adicionar referência/ }).click();
    await page.getByRole('textbox', { name: 'Referência 1' }).fill('isso não é url');
    await page.getByText('Esse endereço não parece válido.').waitFor();
    await page.getByRole('textbox', { name: 'Referência 1' }).fill('www.referencia.com.br');
    await page.locator('#conteudo').getByRole('button', { name: 'Cores', exact: true }).click();
    await page.getByLabel('O que ainda precisará ser produzido?').fill('Fotos profissionais');
  });

  await step('etapa 11: técnica — perguntas e campos condicionais', async () => {
    await next();
    await page.getByRole('radio', { name: 'Sim' }).first().click();
    await page.getByLabel('Qual é o domínio?').fill('ateliernorte.com.br');
    await page.getByRole('radio', { name: 'Não sei' }).nth(1).click();
  });

  await step('mesma tela: prazo e prioridades', async () => {
    await page.getByLabel('Data desejada de lançamento').fill('2027-03-01');
    await page.getByRole('radio', { name: 'Indispensável' }).first().click();
    await page.getByRole('radio', { name: 'O cliente' }).click();
    await shot('12-prazo');
  });

  await step('resumo lateral reflete as escolhas e permite editar', async () => {
    await page.getByRole('button', { name: /Resumo/ }).click();
    await page.getByRole('dialog', { name: 'Resumo até agora' }).getByText('Atelier Norte').waitFor();
    await page.getByRole('button', { name: 'Editar Estilo' }).click();
    await page.getByRole('radio', { name: /Elegante/ }).waitFor();
    assert.match(page.url(), /step\/1$/);
  });

  await step('navegar para trás e para a frente mantém as escolhas', async () => {
    assert.equal(await page.getByRole('radio', { name: /Site institucional/ }).getAttribute('aria-checked'), 'true');
    await back();
    assert.equal(await page.getByLabel('Nome do cliente').inputValue(), 'Marina Duarte');
    await next();
    assert.equal(await page.getByRole('radio', { name: /Elegante/ }).getAttribute('aria-checked'), 'true');
  });

  await step('pular, “ainda não sei” e recomendação (com confirmação)', async () => {
    await page.goto(URL + '#/p/' + page.url().match(/\/p\/([^/]+)/)[1] + '/step/2');
    await page.getByRole('button', { name: 'Ainda não sei' }).click(); // vai para a tela 4
    await page.getByRole('button', { name: /Voltar/ }).first().click();
    await page.getByText(/Marcado como “ainda não sei”/).first().waitFor();
    await page.getByRole('button', { name: /Quero uma recomendação/ }).click();
    await page.getByRole('region', { name: 'Recomendação' }).waitFor();
    await page.getByRole('button', { name: 'Agora não' }).click();
  });

  await step('recarregar a página não perde dados', async () => {
    await page.waitForTimeout(600);
    await page.reload();
    await page.getByRole('heading', { name: /Como as palavras/ }).waitFor();
    await page.getByRole('button', { name: /Resumo/ }).click();
    await page.getByRole('dialog').getByText('Atelier Norte').waitFor();
    await page.keyboard.press('Escape');
  });

  await step('prévia desktop e celular, menu móvel e tela cheia', async () => {
    await page.goto(URL + '#/p/' + page.url().match(/\/p\/([^/]+)/)[1] + '/step/1');
    await page.getByRole('radio', { name: 'Celular' }).click();
    await page.getByLabel('Abrir menu simulado').click();
    await page.getByLabel('Fechar menu simulado').waitFor();
    await shot('prev-celular');
    await page.getByRole('radio', { name: 'Computador' }).click();
    await page.getByRole('button', { name: 'Ver prévia em tela cheia' }).click();
    await page.getByRole('dialog').locator('.sim-note').waitFor();
    await shot('prev-cheia');
    await page.keyboard.press('Escape');
  });

  await step('modo reunião oculta anotações privadas', async () => {
    await page.goto(URL + '#/p/' + page.url().match(/\/p\/([^/]+)/)[1] + '/step/0');
    await page.getByLabel('Visível apenas no modo de edição').waitFor();
    await page.getByRole('radio', { name: 'Reunião' }).click();
    await page.getByText('As anotações privadas ficam ocultas').waitFor();
    assert.equal(await page.getByText('NOTA-SECRETA').count(), 0);
    assert.equal(await page.getByRole('button', { name: /Anotações/ }).count(), 0);
    await shot('reuniao');
    await page.getByRole('radio', { name: 'Edição' }).click();
  });

  let projectId;
  await step('visão geral: seções, pendências e notas ocultas por padrão', async () => {
    projectId = page.url().match(/\/p\/([^/]+)/)[1];
    await page.goto(URL + `#/p/${projectId}/overview`);
    await page.getByRole('heading', { name: 'Atelier Norte' }).first().waitFor();
    for (const t of ['Dados do cliente', 'Direção visual escolhida', 'Paleta de cores', 'Mapa de páginas', 'Pendências e decisões em aberto']) await page.getByRole('heading', { name: t }).waitFor();
    assert.equal(await page.getByText('NOTA-SECRETA').count(), 0);
    await shot('overview');
  });

  await step('copiar resumo (sem notas)', async () => {
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copiar resumo' }).click();
    await page.getByText('Resumo copiado', { exact: true }).waitFor();
    const txt = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(txt, /BRIEFING — Atelier Norte/);
    assert.ok(!txt.includes('NOTA-SECRETA'));
  });

  await step('exportar JSON e importar de volta', async () => {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar JSON' }).click()]);
    const file = path.join(OUT, 'briefing.json');
    await dl.saveAs(file);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(data.app, 'studio-brief');
    assert.equal(data.project.devNotes, '');
    assert.equal(data.project.client.company, 'Atelier Norte');
    await page.locator('input[type=file]').setInputFiles(file);
    await page.getByText('Importado como novo projeto').waitFor();
    // arquivo inválido
    const bad = path.join(OUT, 'ruim.json'); fs.writeFileSync(bad, '{"x":1}');
    await page.locator('input[type=file]').setInputFiles(bad);
    await page.getByText(/não parece ter sido exportado/).waitFor();
  });

  await step('imprimir / PDF: capa do profissional e sem controles', async () => {
    await page.goto(URL + `#/p/${projectId}/overview`);
    await page.getByRole('button', { name: 'Perfil do profissional' }).click();
    await page.getByLabel('Nome ou estúdio').fill('Estúdio Ravena');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.topbar').isVisible(), false);
    assert.equal(await page.locator('.print-cover').isVisible(), true);
    await page.pdf({ path: path.join(OUT, 'briefing.pdf'), format: 'A4', printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    assert.ok(fs.statSync(path.join(OUT, 'briefing.pdf')).size > 20000);
  });

  await step('marcar concluído e lista de projetos', async () => {
    await page.getByRole('button', { name: /Marcar como concluído/ }).click();
    await page.getByText('Briefing concluído. Você ainda pode editar').waitFor();
    await page.goto(URL);
    await page.getByRole('list').getByText('Atelier Norte').first().waitFor();
    assert.equal(await page.locator('.proj-row').count(), 2);
    await shot('home-lista');
  });

  await step('pesquisar, filtrar e estado vazio da busca', async () => {
    await page.getByLabel('Pesquisar por cliente').fill('inexistente');
    await page.getByText('Nada encontrado').waitFor();
    await page.getByLabel('Pesquisar por cliente').fill('marina');
    assert.equal(await page.locator('.proj-row').count(), 2);
    await page.getByRole('button', { name: 'Limpar filtros' }).isVisible().catch(() => {});
    await page.getByLabel('Pesquisar por cliente').fill('');
  });

  await step('duplicar e reabrir projeto', async () => {
    await page.getByRole('button', { name: /Mais ações para Atelier Norte/ }).first().click();
    await page.getByRole('menuitem', { name: 'Duplicar' }).click();
    await page.getByText('Projeto duplicado').waitFor();
    assert.equal(await page.locator('.proj-row').count(), 3);
    await page.getByRole('button', { name: /Continuar/ }).first().click();
    await page.waitForURL(/step\/\d+$/);
    await page.getByRole('heading', { level: 1 }).waitFor();
  });

  await step('excluir com confirmação (cancelar e confirmar)', async () => {
    await page.goto(URL);
    await page.getByRole('button', { name: /Mais ações para/ }).first().click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    assert.equal(await page.locator('.proj-row').count(), 3);
    await page.getByRole('button', { name: /Mais ações para/ }).first().click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await page.getByText('Projeto excluído').waitFor();
    assert.equal(await page.locator('.proj-row').count(), 2);
  });

  await step('projeto inexistente mostra estado vazio', async () => {
    await page.goto(URL + '#/p/nao-existe/step/2');
    await page.getByText('Projeto não encontrado').waitFor();
  });

  await step('projeto vazio: campos incompletos geram pendências, sem erros', async () => {
    await page.goto(URL);
    await page.getByRole('button', { name: /Novo projeto/ }).first().click();
    await page.getByRole('button', { name: /Começar/ }).click();
    const id = page.url().match(/\/p\/([^/]+)/)[1];
    await page.goto(URL + `#/p/${id}/overview`);
    await page.getByRole('heading', { name: 'Projeto sem nome' }).waitFor();
    assert.ok((await page.locator('#ov-20').locator('..').locator('li').count()) > 5);
    for (const s of [1, 3, 4, 5]) { await page.goto(URL + `#/p/${id}/step/${s}`); await page.waitForTimeout(150); }
  });

  await step('celular: layout sem rolagem horizontal', async () => {
    await page.waitForTimeout(500);
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, storageState: await ctx.storageState() });
    const mp = await m.newPage();
    await mp.goto(URL);
    for (const hash of ['', ...[0, 1, 2, 3, 4, 5].map((n) => `#/p/${projectId}/step/${n}`), `#/p/${projectId}/overview`]) {
      await mp.goto(URL + hash); await mp.waitForTimeout(400);
      const over = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (over > 1) {
        const who = await mp.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => !e.closest('.preview-col') && e.getBoundingClientRect().right > innerWidth + 1).slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`));
        assert.fail(`rolagem horizontal em ${hash || 'home'}: ${over}px — ${who.join(' | ')}`);
      }
    }
    await mp.goto(URL + `#/p/${projectId}/step/1`); await mp.waitForTimeout(400);
    await mp.screenshot({ path: path.join(OUT, 'mobile-estilo.png') });
    await m.close();
  });

  await step('sem erros de console ou exceções', async () => { assert.deepEqual(problems, []); });
  console.log(`\nTudo certo. Capturas e arquivos em: ${OUT}`);
} catch (e) {
  console.error('\nFALHOU:', e.message);
  await shot('falha').catch(() => {});
  console.error('Problemas de console:', problems);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill();
}
