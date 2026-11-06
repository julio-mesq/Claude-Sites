import type { SiteTypeId, StyleId, SliderId } from './types';

/* ---------- Objetivos ---------- */
export const GOALS = [
  { id: 'promote', label: 'Divulgar minha empresa', hint: 'Apresentar a marca com credibilidade' },
  { id: 'sell', label: 'Vender produtos', hint: 'Loja com catálogo e pagamento' },
  { id: 'orders', label: 'Receber pedidos', hint: 'Pedidos por formulário ou WhatsApp' },
  { id: 'leads', label: 'Conseguir novos clientes', hint: 'Gerar contatos e orçamentos' },
  { id: 'services', label: 'Apresentar meus serviços', hint: 'Explicar o que você oferece' },
  { id: 'portfolio', label: 'Mostrar meu portfólio', hint: 'Exibir trabalhos realizados' },
  { id: 'booking', label: 'Receber agendamentos', hint: 'Horários marcados online' },
  { id: 'events', label: 'Divulgar eventos', hint: 'Datas, programação e inscrições' },
  { id: 'content', label: 'Criar conteúdo', hint: 'Blog, artigos e novidades' },
  { id: 'courses', label: 'Oferecer cursos', hint: 'Aulas e área de alunos' },
  { id: 'other', label: 'Outro objetivo', hint: 'Descreva com suas palavras' },
] as const;

export const VISITOR_ACTIONS = [
  'Chamar no WhatsApp', 'Preencher um formulário', 'Comprar online', 'Agendar um horário',
  'Pedir um orçamento', 'Ligar', 'Seguir nas redes sociais', 'Assinar a newsletter', 'Visitar a loja física',
];

/* ---------- Seções ---------- */
export const SECTIONS: Record<string, string> = {
  hero: 'Destaque inicial', about: 'Sobre', services: 'Serviços', products: 'Produtos',
  gallery: 'Galeria', testimonials: 'Depoimentos', faq: 'Perguntas frequentes', contact: 'Contato',
  cta: 'Chamada para ação', steps: 'Como funciona', portfolio: 'Trabalhos', schedule: 'Agendamento',
  menu: 'Cardápio', events: 'Programação', courses: 'Cursos', blog: 'Últimas publicações',
  stats: 'Números', newsletter: 'Newsletter', cart: 'Carrinho', checkout: 'Finalizar pedido',
  account: 'Área do cliente', legal: 'Texto legal',
};

/* ---------- Tipos de site ---------- */
export interface SiteTypeDef {
  id: SiteTypeId; name: string; blurb: string; features: string[]; structure: string[];
  homeSections: string[]; defaultPages: string[]; goals: string[]; hero: { title: string; sub: string; cta: string };
}
export const SITE_TYPES: SiteTypeDef[] = [
  { id: 'institutional', name: 'Site institucional', blurb: 'Apresenta a empresa, seus serviços e formas de contato.',
    features: ['whatsapp', 'contact-form', 'social', 'gallery', 'testimonials'], structure: ['Início', 'Sobre', 'Serviços', 'Contato'],
    homeSections: ['hero', 'about', 'services', 'testimonials', 'cta'], defaultPages: ['home', 'about', 'services', 'contact'],
    goals: ['promote', 'services', 'leads'], hero: { title: 'Uma presença sólida para a sua marca', sub: 'Apresente quem você é, o que faz e como falar com você.', cta: 'Fale conosco' } },
  { id: 'landing', name: 'Landing page', blurb: 'Uma página única, focada em uma ação.',
    features: ['whatsapp', 'contact-form', 'newsletter', 'faq'], structure: ['Destaque', 'Benefícios', 'Depoimentos', 'Chamada final'],
    homeSections: ['hero', 'services', 'steps', 'testimonials', 'faq', 'cta'], defaultPages: ['home'],
    goals: ['leads', 'promote'], hero: { title: 'Uma oferta clara, uma ação óbvia', sub: 'Tudo em uma página para o visitante decidir rápido.', cta: 'Quero saber mais' } },
  { id: 'store', name: 'Loja virtual', blurb: 'Catálogo, carrinho e finalização de compra.',
    features: ['catalog', 'cart', 'payments', 'shipping', 'coupons', 'orders-area'], structure: ['Início', 'Produtos', 'Carrinho', 'Checkout', 'Contato'],
    homeSections: ['hero', 'products', 'stats', 'testimonials', 'newsletter'], defaultPages: ['home', 'products', 'cart', 'checkout', 'contact'],
    goals: ['sell'], hero: { title: 'Produtos escolhidos com cuidado', sub: 'Navegue pelo catálogo e compre com segurança.', cta: 'Ver produtos' } },
  { id: 'portfolio', name: 'Portfólio', blurb: 'Mostra trabalhos e leva o visitante ao contato.',
    features: ['gallery', 'video', 'contact-form', 'social'], structure: ['Início', 'Trabalhos', 'Sobre', 'Contato'],
    homeSections: ['hero', 'portfolio', 'about', 'testimonials', 'contact'], defaultPages: ['home', 'portfolio', 'about', 'contact'],
    goals: ['portfolio', 'leads'], hero: { title: 'Trabalhos que falam por si', sub: 'Uma seleção de projetos e a história por trás deles.', cta: 'Ver trabalhos' } },
  { id: 'menu', name: 'Cardápio digital', blurb: 'Cardápio atualizado, com pedidos pelo WhatsApp.',
    features: ['whatsapp', 'whatsapp-orders', 'gallery', 'social'], structure: ['Início', 'Cardápio', 'Endereço e horários', 'Contato'],
    homeSections: ['hero', 'menu', 'gallery', 'contact'], defaultPages: ['home', 'menu', 'contact'],
    goals: ['orders', 'promote'], hero: { title: 'Do nosso balcão para a sua mesa', sub: 'Veja o cardápio e faça seu pedido em poucos toques.', cta: 'Ver cardápio' } },
  { id: 'booking', name: 'Site de agendamentos', blurb: 'O cliente escolhe serviço, dia e horário.',
    features: ['booking', 'calendar', 'quote', 'reviews', 'whatsapp'], structure: ['Início', 'Serviços', 'Agendar', 'Contato'],
    homeSections: ['hero', 'services', 'schedule', 'testimonials', 'faq'], defaultPages: ['home', 'services', 'booking', 'contact'],
    goals: ['booking', 'services'], hero: { title: 'Reserve seu horário em poucos cliques', sub: 'Escolha o serviço, o dia e confirme. Simples assim.', cta: 'Agendar agora' } },
  { id: 'blog', name: 'Blog', blurb: 'Publica artigos e organiza conteúdo por assunto.',
    features: ['blog', 'search', 'newsletter', 'social'], structure: ['Início', 'Artigos', 'Sobre', 'Contato'],
    homeSections: ['hero', 'blog', 'newsletter', 'about'], defaultPages: ['home', 'blog', 'about', 'contact'],
    goals: ['content'], hero: { title: 'Ideias que valem a leitura', sub: 'Artigos, novidades e bastidores, organizados por tema.', cta: 'Ler artigos' } },
  { id: 'events', name: 'Site de eventos', blurb: 'Data, programação, local e inscrição.',
    features: ['lead-capture', 'contact-form', 'calendar', 'gallery'], structure: ['Início', 'Programação', 'Local', 'Inscrição'],
    homeSections: ['hero', 'events', 'stats', 'faq', 'cta'], defaultPages: ['home', 'events', 'faq', 'contact'],
    goals: ['events'], hero: { title: 'Um encontro para guardar na agenda', sub: 'Programação completa, local e inscrição em um só lugar.', cta: 'Garantir minha vaga' } },
  { id: 'education', name: 'Plataforma educacional', blurb: 'Cursos, aulas e área para alunos.',
    features: ['login', 'client-panel', 'courses', 'downloads', 'payments'], structure: ['Início', 'Cursos', 'Área do aluno', 'Contato'],
    homeSections: ['hero', 'courses', 'steps', 'testimonials', 'faq'], defaultPages: ['home', 'courses', 'client-area', 'contact'],
    goals: ['courses'], hero: { title: 'Aprender no seu ritmo', sub: 'Cursos organizados em trilhas, com acompanhamento.', cta: 'Conhecer cursos' } },
  { id: 'custom', name: 'Site personalizado', blurb: 'Uma combinação sob medida das necessidades.',
    features: ['contact-form', 'whatsapp'], structure: ['A definir com você'],
    homeSections: ['hero', 'about', 'services', 'cta'], defaultPages: ['home', 'about', 'contact'],
    goals: [], hero: { title: 'Um site desenhado para o seu caso', sub: 'Combinamos os recursos certos para o seu negócio.', cta: 'Começar' } },
];
export const siteTypeById = (id: SiteTypeId | null) => SITE_TYPES.find((t) => t.id === id) ?? null;

/* ---------- Estilos visuais ---------- */
export interface StyleSpec {
  id: StyleId; name: string; blurb: string;
  hero: 'centered' | 'split' | 'editorial' | 'bold' | 'minimal';
  radius: number; btnRadius: number; spacing: number; card: 'subtle' | 'elevated';
  heading: string; body: string; weight: number; upper: boolean; mono: boolean;
  bg: string; ink: string; primary: string; secondary: string;
  motion: 'none' | 'subtle' | 'rich'; icons: 'line' | 'filled'; imagery: 'photos' | 'illustrations';
}
export const STYLES: StyleSpec[] = [
  { id: 'minimal', name: 'Minimalista', blurb: 'Limpo, poucos elementos e muito espaço em branco.', hero: 'minimal', radius: 4, btnRadius: 4, spacing: 80, card: 'subtle', heading: 'inter', body: 'inter', weight: 500, upper: false, mono: false, bg: '#FFFFFF', ink: '#20242B', primary: '#20242B', secondary: '#9AA1AB', motion: 'subtle', icons: 'line', imagery: 'photos' },
  { id: 'elegant', name: 'Elegante', blurb: 'Refinado, com tipografia sofisticada e cores discretas.', hero: 'centered', radius: 2, btnRadius: 2, spacing: 72, card: 'subtle', heading: 'playfair', body: 'inter', weight: 500, upper: false, mono: false, bg: '#F6F2EC', ink: '#2B2622', primary: '#7A5C3E', secondary: '#C9B79C', motion: 'subtle', icons: 'line', imagery: 'photos' },
  { id: 'corporate', name: 'Corporativo', blurb: 'Organizado, profissional e confiável.', hero: 'split', radius: 6, btnRadius: 6, spacing: 56, card: 'elevated', heading: 'manrope', body: 'inter', weight: 700, upper: false, mono: false, bg: '#F4F7FB', ink: '#14213D', primary: '#1D4ED8', secondary: '#93B4F5', motion: 'subtle', icons: 'filled', imagery: 'photos' },
  { id: 'modern', name: 'Moderno', blurb: 'Contemporâneo, dinâmico e com bom ritmo.', hero: 'split', radius: 16, btnRadius: 999, spacing: 64, card: 'elevated', heading: 'dm-sans', body: 'dm-sans', weight: 700, upper: false, mono: false, bg: '#FFFFFF', ink: '#111827', primary: '#0F766E', secondary: '#99E0D6', motion: 'rich', icons: 'line', imagery: 'illustrations' },
  { id: 'creative', name: 'Criativo', blurb: 'Composições diferentes e muita personalidade.', hero: 'bold', radius: 22, btnRadius: 999, spacing: 60, card: 'elevated', heading: 'fraunces', body: 'dm-sans', weight: 800, upper: false, mono: false, bg: '#FFF4E8', ink: '#2A1B12', primary: '#C2410C', secondary: '#FBBF77', motion: 'rich', icons: 'filled', imagery: 'illustrations' },
  { id: 'warm', name: 'Acolhedor', blurb: 'Cores suaves e atmosfera amigável.', hero: 'centered', radius: 20, btnRadius: 999, spacing: 68, card: 'subtle', heading: 'lora', body: 'dm-sans', weight: 600, upper: false, mono: false, bg: '#FBF5EF', ink: '#3A2E28', primary: '#B4694A', secondary: '#E8C9B3', motion: 'subtle', icons: 'filled', imagery: 'illustrations' },
  { id: 'editorial', name: 'Editorial', blurb: 'Tipografia marcante e fotografias bem posicionadas.', hero: 'editorial', radius: 0, btnRadius: 0, spacing: 64, card: 'subtle', heading: 'source-serif', body: 'inter', weight: 700, upper: true, mono: false, bg: '#FAFAF7', ink: '#161616', primary: '#161616', secondary: '#B8B8B0', motion: 'none', icons: 'line', imagery: 'photos' },
  { id: 'tech', name: 'Tecnológico', blurb: 'Interfaces precisas e elementos digitais discretos.', hero: 'split', radius: 8, btnRadius: 8, spacing: 60, card: 'subtle', heading: 'space-grotesk', body: 'inter', weight: 600, upper: false, mono: true, bg: '#0E1116', ink: '#E6EAF0', primary: '#5EEAD4', secondary: '#334155', motion: 'rich', icons: 'line', imagery: 'illustrations' },
];
export const styleById = (id: StyleId | null) => STYLES.find((s) => s.id === id) ?? null;

export const SLIDERS: { id: SliderId; left: string; right: string }[] = [
  { id: 'detail', left: 'Simples', right: 'Detalhado' },
  { id: 'tone', left: 'Sério', right: 'Descontraído' },
  { id: 'presence', left: 'Discreto', right: 'Marcante' },
  { id: 'innovation', left: 'Tradicional', right: 'Inovador' },
  { id: 'motion', left: 'Estático', right: 'Dinâmico' },
];

/* ---------- Paletas ---------- */
export interface PaletteDef {
  id: string; name: string; primary: string; secondary: string; accent: string;
  light: string; dark: string;
}
export const PALETTES: PaletteDef[] = [
  { id: 'neutral', name: 'Neutros sofisticados', primary: '#4B5563', secondary: '#A8A29E', accent: '#B08D57', light: '#F8F9FA', dark: '#16181C' },
  { id: 'corporate-blue', name: 'Azul corporativo', primary: '#1D4ED8', secondary: '#64748B', accent: '#0EA5E9', light: '#F4F7FB', dark: '#0F172A' },
  { id: 'nature', name: 'Verde natural', primary: '#2F6B4F', secondary: '#8DB596', accent: '#C9A24D', light: '#F5F8F4', dark: '#12201A' },
  { id: 'earth', name: 'Tons terrosos', primary: '#A5532F', secondary: '#C8A27C', accent: '#6B7A4B', light: '#FAF4EC', dark: '#231A14' },
  { id: 'mono', name: 'Preto e branco', primary: '#111111', secondary: '#6B6B6B', accent: '#111111', light: '#FFFFFF', dark: '#0B0B0B' },
  { id: 'pastel', name: 'Tons pastéis', primary: '#7C8FD6', secondary: '#F2B8C6', accent: '#9AD4C0', light: '#FBF8FD', dark: '#1D1B26' },
  { id: 'custom', name: 'Paleta personalizada', primary: '#334155', secondary: '#94A3B8', accent: '#D97706', light: '#FFFFFF', dark: '#111418' },
];
export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];

/* ---------- Tipografia ---------- */
export interface FontDef { id: string; name: string; css: string; serif: boolean; feel: 'traditional' | 'modern' }
export const FONTS: FontDef[] = [
  { id: 'inter', name: 'Inter', css: "'Inter Variable', system-ui, sans-serif", serif: false, feel: 'modern' },
  { id: 'manrope', name: 'Manrope', css: "'Manrope Variable', system-ui, sans-serif", serif: false, feel: 'modern' },
  { id: 'dm-sans', name: 'DM Sans', css: "'DM Sans Variable', system-ui, sans-serif", serif: false, feel: 'modern' },
  { id: 'space-grotesk', name: 'Space Grotesk', css: "'Space Grotesk Variable', system-ui, sans-serif", serif: false, feel: 'modern' },
  { id: 'playfair', name: 'Playfair Display', css: "'Playfair Display Variable', Georgia, serif", serif: true, feel: 'traditional' },
  { id: 'fraunces', name: 'Fraunces', css: "'Fraunces Variable', Georgia, serif", serif: true, feel: 'traditional' },
  { id: 'lora', name: 'Lora', css: "'Lora Variable', Georgia, serif", serif: true, feel: 'traditional' },
  { id: 'source-serif', name: 'Source Serif 4', css: "'Source Serif 4 Variable', Georgia, serif", serif: true, feel: 'traditional' },
];
export const fontById = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0];

export const FONT_PAIRS = [
  { id: 'clean', name: 'Limpa e neutra', heading: 'inter', body: 'inter', feel: 'modern' as const },
  { id: 'editorial', name: 'Editorial clássica', heading: 'playfair', body: 'inter', feel: 'traditional' as const },
  { id: 'friendly', name: 'Amigável', heading: 'dm-sans', body: 'dm-sans', feel: 'modern' as const },
  { id: 'authority', name: 'Autoridade', heading: 'manrope', body: 'inter', feel: 'modern' as const },
  { id: 'literary', name: 'Literária', heading: 'source-serif', body: 'inter', feel: 'traditional' as const },
  { id: 'warm', name: 'Calorosa', heading: 'lora', body: 'dm-sans', feel: 'traditional' as const },
  { id: 'expressive', name: 'Expressiva', heading: 'fraunces', body: 'dm-sans', feel: 'traditional' as const },
  { id: 'technical', name: 'Técnica', heading: 'space-grotesk', body: 'inter', feel: 'modern' as const },
];

/* ---------- Páginas ---------- */
export interface PageDef { key: string; name: string; sections: string[]; types?: SiteTypeId[]; hint: string }
export const PAGE_CATALOG: PageDef[] = [
  { key: 'home', name: 'Início', sections: ['hero', 'about', 'services', 'cta'], hint: 'A porta de entrada do site' },
  { key: 'about', name: 'Sobre nós', sections: ['about', 'stats', 'testimonials'], hint: 'História, valores e equipe' },
  { key: 'services', name: 'Serviços', sections: ['services', 'steps', 'faq', 'cta'], hint: 'O que você oferece' },
  { key: 'products', name: 'Produtos', sections: ['products', 'cta'], hint: 'Catálogo organizado', types: ['store', 'menu', 'custom', 'institutional', 'portfolio'] },
  { key: 'portfolio', name: 'Portfólio', sections: ['portfolio', 'cta'], hint: 'Trabalhos realizados' },
  { key: 'gallery', name: 'Galeria', sections: ['gallery'], hint: 'Fotos e vídeos' },
  { key: 'testimonials', name: 'Depoimentos', sections: ['testimonials'], hint: 'O que dizem sobre você' },
  { key: 'contact', name: 'Contato', sections: ['contact', 'faq'], hint: 'Formas de falar com você' },
  { key: 'faq', name: 'Perguntas frequentes', sections: ['faq', 'cta'], hint: 'Dúvidas comuns respondidas' },
  { key: 'blog', name: 'Blog', sections: ['blog', 'newsletter'], hint: 'Artigos e novidades' },
  { key: 'booking', name: 'Agendamentos', sections: ['schedule', 'faq'], hint: 'Marcar horários', types: ['booking', 'institutional', 'custom'] },
  { key: 'menu', name: 'Cardápio', sections: ['menu', 'gallery'], hint: 'Pratos e bebidas', types: ['menu', 'custom'] },
  { key: 'cart', name: 'Carrinho', sections: ['cart'], hint: 'Itens escolhidos', types: ['store', 'menu', 'custom', 'education'] },
  { key: 'checkout', name: 'Checkout', sections: ['checkout'], hint: 'Finalização da compra', types: ['store', 'menu', 'custom', 'education'] },
  { key: 'client-area', name: 'Área do cliente', sections: ['account'], hint: 'Login e acompanhamento', types: ['store', 'education', 'booking', 'custom'] },
  { key: 'events', name: 'Programação', sections: ['events', 'cta'], hint: 'Agenda do evento', types: ['events', 'custom'] },
  { key: 'courses', name: 'Cursos', sections: ['courses', 'faq'], hint: 'Lista de cursos', types: ['education', 'custom'] },
  { key: 'privacy', name: 'Política de privacidade', sections: ['legal'], hint: 'Exigida ao coletar dados (LGPD)' },
  { key: 'terms', name: 'Termos de uso', sections: ['legal'], hint: 'Regras de uso do site' },
];
export const pageDefByKey = (key: string) => PAGE_CATALOG.find((p) => p.key === key);

/* ---------- Funcionalidades ---------- */
export type FeatureGroup = 'Comunicação' | 'Vendas' | 'Serviços' | 'Conteúdo' | 'Recursos avançados';
export type FeatureLevel = 'essential' | 'optional' | 'advanced';
export interface FeatureDef {
  id: string; group: FeatureGroup; name: string; desc: string; level: FeatureLevel;
  types: SiteTypeId[]; goals?: string[]; needs?: string; integration?: boolean; demo?: 'whatsapp' | 'form' | 'cart' | 'calendar' | 'search' | 'gallery' | 'login' | 'chat' | 'newsletter';
}
const ALL: SiteTypeId[] = ['institutional', 'landing', 'store', 'portfolio', 'menu', 'booking', 'blog', 'events', 'education', 'custom'];
export const FEATURES: FeatureDef[] = [
  { id: 'whatsapp', group: 'Comunicação', name: 'Botão do WhatsApp', desc: 'Atalho fixo para iniciar uma conversa com você.', level: 'essential', types: ALL, demo: 'whatsapp' },
  { id: 'contact-form', group: 'Comunicação', name: 'Formulário de contato', desc: 'O visitante envia uma mensagem sem sair do site.', level: 'essential', types: ALL, demo: 'form' },
  { id: 'chat', group: 'Comunicação', name: 'Chat', desc: 'Conversa em tempo real. Exige serviço externo ou atendimento.', level: 'advanced', types: ['store', 'booking', 'education', 'custom'], demo: 'chat', integration: true },
  { id: 'social', group: 'Comunicação', name: 'Links de redes sociais', desc: 'Ícones levando aos seus perfis.', level: 'essential', types: ALL },
  { id: 'lead-capture', group: 'Comunicação', name: 'Cadastro de interessados', desc: 'Coleta nome e contato de quem quer ser avisado.', level: 'optional', types: ['landing', 'events', 'education', 'institutional', 'custom'], demo: 'form' },
  { id: 'newsletter', group: 'Comunicação', name: 'Newsletter', desc: 'Inscrição para receber novidades por e-mail.', level: 'optional', types: ['blog', 'landing', 'store', 'institutional', 'custom'], demo: 'newsletter', integration: true },

  { id: 'catalog', group: 'Vendas', name: 'Catálogo de produtos', desc: 'Lista de produtos com fotos, descrição e categorias.', level: 'essential', types: ['store', 'menu', 'institutional', 'custom'], goals: ['sell', 'orders'], demo: 'gallery' },
  { id: 'cart', group: 'Vendas', name: 'Carrinho', desc: 'O visitante junta itens antes de finalizar.', level: 'essential', types: ['store', 'menu', 'custom'], goals: ['sell'], demo: 'cart' },
  { id: 'payments', group: 'Vendas', name: 'Pagamento online', desc: 'Cartão, Pix ou boleto. Precisa de conta em um provedor.', level: 'advanced', types: ['store', 'education', 'custom'], goals: ['sell', 'courses'], integration: true, needs: 'Conta em provedor de pagamento' },
  { id: 'coupons', group: 'Vendas', name: 'Cupons', desc: 'Códigos de desconto para campanhas.', level: 'optional', types: ['store', 'education'], goals: ['sell'] },
  { id: 'shipping', group: 'Vendas', name: 'Cálculo de frete', desc: 'Valor de entrega pelo CEP. Depende de transportadora.', level: 'advanced', types: ['store'], goals: ['sell'], integration: true, needs: 'Contrato ou conta com transportadora' },
  { id: 'whatsapp-orders', group: 'Vendas', name: 'Pedidos enviados ao WhatsApp', desc: 'O carrinho vira uma mensagem pronta para você.', level: 'essential', types: ['store', 'menu', 'custom'], goals: ['orders', 'sell'], demo: 'whatsapp' },
  { id: 'orders-area', group: 'Vendas', name: 'Área de pedidos', desc: 'O cliente acompanha o que já comprou.', level: 'advanced', types: ['store', 'education'], goals: ['sell'] },

  { id: 'booking', group: 'Serviços', name: 'Agendamento online', desc: 'O cliente escolhe serviço, dia e horário.', level: 'essential', types: ['booking', 'institutional', 'custom'], goals: ['booking'], demo: 'calendar' },
  { id: 'calendar', group: 'Serviços', name: 'Calendário', desc: 'Visualização de datas disponíveis ou eventos.', level: 'optional', types: ['booking', 'events', 'custom'], goals: ['booking', 'events'], demo: 'calendar' },
  { id: 'quote', group: 'Serviços', name: 'Solicitação de orçamento', desc: 'Formulário guiado com os detalhes do pedido.', level: 'essential', types: ['institutional', 'booking', 'portfolio', 'custom'], goals: ['leads', 'services'], demo: 'form' },
  { id: 'uploads', group: 'Serviços', name: 'Envio de arquivos', desc: 'O visitante anexa documentos ou imagens.', level: 'optional', types: ['institutional', 'booking', 'custom'], needs: 'Armazenamento de arquivos no servidor' },
  { id: 'reviews', group: 'Serviços', name: 'Avaliações de clientes', desc: 'Notas e comentários exibidos no site.', level: 'optional', types: ['booking', 'store', 'institutional', 'custom'] },

  { id: 'blog', group: 'Conteúdo', name: 'Blog', desc: 'Artigos com categorias e data de publicação.', level: 'optional', types: ['blog', 'institutional', 'custom', 'portfolio'], goals: ['content'] },
  { id: 'search', group: 'Conteúdo', name: 'Busca interna', desc: 'Campo para encontrar páginas, produtos ou artigos.', level: 'optional', types: ['blog', 'store', 'education', 'custom'], demo: 'search' },
  { id: 'gallery', group: 'Conteúdo', name: 'Galeria de imagens', desc: 'Grade de fotos com visualização ampliada.', level: 'optional', types: ['portfolio', 'menu', 'events', 'institutional', 'custom'], demo: 'gallery' },
  { id: 'video', group: 'Conteúdo', name: 'Vídeos', desc: 'Vídeos incorporados de YouTube ou Vimeo.', level: 'optional', types: ['portfolio', 'education', 'institutional', 'custom'] },
  { id: 'downloads', group: 'Conteúdo', name: 'Downloads', desc: 'Catálogos, materiais e arquivos para baixar.', level: 'optional', types: ['education', 'institutional', 'custom'] },
  { id: 'faq', group: 'Conteúdo', name: 'FAQ', desc: 'Respostas rápidas para as dúvidas mais comuns.', level: 'essential', types: ALL },
  { id: 'testimonials', group: 'Conteúdo', name: 'Depoimentos', desc: 'Frases de clientes satisfeitos.', level: 'optional', types: ['institutional', 'landing', 'portfolio', 'booking', 'custom'] },
  { id: 'courses', group: 'Conteúdo', name: 'Cursos e aulas', desc: 'Módulos, aulas e progresso do aluno.', level: 'advanced', types: ['education'], goals: ['courses'] },

  { id: 'login', group: 'Recursos avançados', name: 'Login e cadastro', desc: 'Contas de usuário com e-mail e senha.', level: 'advanced', types: ['store', 'education', 'custom', 'booking'], demo: 'login', needs: 'Banco de dados e servidor' },
  { id: 'admin', group: 'Recursos avançados', name: 'Área administrativa', desc: 'Painel para você editar conteúdo sozinho.', level: 'advanced', types: ALL, needs: 'Servidor ou serviço de gestão de conteúdo' },
  { id: 'database', group: 'Recursos avançados', name: 'Banco de dados', desc: 'Armazena cadastros, pedidos e conteúdos dinâmicos.', level: 'advanced', types: ['store', 'education', 'booking', 'custom'], needs: 'Servidor e banco de dados' },
  { id: 'client-panel', group: 'Recursos avançados', name: 'Painel de clientes', desc: 'Área reservada com informações de cada cliente.', level: 'advanced', types: ['education', 'booking', 'store', 'custom'], needs: 'Login e banco de dados' },
  { id: 'integrations', group: 'Recursos avançados', name: 'Integrações externas', desc: 'Conexão com sistemas que você já usa.', level: 'advanced', types: ALL, integration: true, needs: 'Credenciais dos sistemas a integrar' },
  { id: 'multilang', group: 'Recursos avançados', name: 'Site multilíngue', desc: 'O mesmo conteúdo em mais de um idioma.', level: 'advanced', types: ALL },
  { id: 'crm', group: 'Recursos avançados', name: 'Integração com CRM', desc: 'Contatos enviados direto para seu CRM.', level: 'advanced', types: ['institutional', 'landing', 'booking', 'custom'], integration: true, needs: 'Conta e credenciais do CRM' },
  { id: 'automation', group: 'Recursos avançados', name: 'Automação de mensagens', desc: 'Respostas e lembretes automáticos.', level: 'advanced', types: ['booking', 'store', 'landing', 'custom'], integration: true, needs: 'Ferramenta de automação ou API do WhatsApp' },
];
export const featureById = (id: string) => FEATURES.find((f) => f.id === id);
export const FEATURE_GROUPS: FeatureGroup[] = ['Comunicação', 'Vendas', 'Serviços', 'Conteúdo', 'Recursos avançados'];
export const LEVEL_LABEL: Record<FeatureLevel, string> = { essential: 'Essencial', optional: 'Opcional', advanced: 'Avançado' };

/* ---------- Comportamento ---------- */
export const PRIORITY_LABEL = { must: 'Indispensável', nice: 'Desejável', later: 'Segunda versão' } as const;

/* ---------- Conteúdo ---------- */
export const CONTENT_ITEMS = [
  { id: 'logo', label: 'Logotipo' }, { id: 'brandbook', label: 'Manual de marca' },
  { id: 'palette', label: 'Paleta de cores' }, { id: 'photos', label: 'Fotografias' },
  { id: 'videos', label: 'Vídeos' }, { id: 'texts', label: 'Textos' },
  { id: 'products', label: 'Descrição de produtos' }, { id: 'serviceList', label: 'Lista de serviços' },
  { id: 'testimonials', label: 'Depoimentos' }, { id: 'business', label: 'Informações comerciais' },
  { id: 'references', label: 'Referências de outros sites' },
];
export const REF_LIKES = ['Cores', 'Organização', 'Animações', 'Imagens', 'Funcionalidades', 'Estilo geral'];

/* ---------- Requisitos técnicos ---------- */
export interface TechQuestion { id: string; q: string; help: string; followUp?: 'domainName' | 'hostingNote' | 'externalList' | 'languages' | 'a11yNote' | 'paymentsNote' }
export const TECH_QUESTIONS: TechQuestion[] = [
  { id: 'domain', q: 'Você já tem um domínio?', help: 'Domínio é o endereço do site, como minhaempresa.com.br.', followUp: 'domainName' },
  { id: 'hosting', q: 'Já tem hospedagem?', help: 'Hospedagem é o “terreno” onde o site fica guardado para ser acessado.', followUp: 'hostingNote' },
  { id: 'emails', q: 'Precisa de e-mails profissionais?', help: 'Endereços como contato@suaempresa.com.br.' },
  { id: 'selfEdit', q: 'Quer editar o conteúdo sozinho?', help: 'Trocar textos, fotos e preços sem depender de um desenvolvedor.' },
  { id: 'admin', q: 'Precisa de um painel administrativo?', help: 'Uma área protegida por senha para gerenciar o site.' },
  { id: 'external', q: 'Precisa conectar sistemas externos?', help: 'Por exemplo ERP, CRM, agenda ou ferramentas de e-mail.', followUp: 'externalList' },
  { id: 'whatsapp', q: 'Precisa de integração com WhatsApp?', help: 'Botões e mensagens que abrem uma conversa com você.' },
  { id: 'payments', q: 'Precisa de integração com pagamentos?', help: 'Receber por cartão, Pix ou boleto direto no site.', followUp: 'paymentsNote' },
  { id: 'analytics', q: 'Precisa de ferramentas de análise?', help: 'Mostram quantas pessoas visitam o site e o que fazem nele.' },
  { id: 'seo', q: 'Deseja otimização para buscadores (SEO)?', help: 'Ajustes para o site aparecer melhor em pesquisas do Google.' },
  { id: 'multilang', q: 'Precisa de mais de um idioma?', help: 'O visitante escolhe o idioma do site.', followUp: 'languages' },
  { id: 'a11y', q: 'Há necessidades especiais de acessibilidade?', help: 'Facilitar o uso por pessoas com deficiência visual, motora ou auditiva.', followUp: 'a11yNote' },
  { id: 'maintenance', q: 'O site precisará de manutenção frequente?', help: 'Atualizações regulares de conteúdo, segurança e recursos.' },
];
export const TECH_CONSIDERATIONS = [
  { id: 'lgpd', title: 'LGPD e dados pessoais', text: 'Se o site coleta nome, e-mail ou telefone, é preciso informar o motivo e proteger esses dados.' },
  { id: 'privacy', title: 'Política de privacidade', text: 'Página que explica quais dados são coletados e como são usados.' },
  { id: 'cookies', title: 'Consentimento de cookies', text: 'Necessário quando o site usa ferramentas de análise ou publicidade.' },
  { id: 'security', title: 'Segurança', text: 'Conexão segura (HTTPS) e atualizações para proteger o site e os visitantes.' },
  { id: 'backup', title: 'Backup', text: 'Cópias de segurança para recuperar o site se algo der errado.' },
  { id: 'performance', title: 'Desempenho', text: 'Imagens leves e código enxuto para o site abrir rápido.' },
  { id: 'responsive', title: 'Responsividade', text: 'O site se adapta bem a celulares, tablets e computadores.' },
  { id: 'seo', title: 'SEO técnico', text: 'Títulos, descrições e estrutura corretos para os buscadores.' },
  { id: 'spam', title: 'Proteção contra spam', text: 'Formulários com verificação para barrar mensagens automáticas.' },
];
