import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso" updated="6 de novembro de 2026">
      <section>
        <h2>1. Aceitação</h2>
        <p>Ao criar uma conta, você concorda com estes termos e com a Política de Privacidade. O FitLife é destinado a pessoas a partir de 16 anos.</p>
      </section>
      <section>
        <h2>2. Natureza do serviço</h2>
        <p>O FitLife oferece ferramentas de organização e orientação geral de bem-estar. As informações, metas e sugestões (inclusive do Fit AI) não constituem diagnóstico, prescrição médica, nutricional ou de treinamento. Consulte profissionais habilitados antes de iniciar ou alterar programas de exercícios ou dieta, especialmente se tiver condições de saúde.</p>
      </section>
      <section>
        <h2>3. Sua conta</h2>
        <ul>
          <li>Mantenha suas credenciais em sigilo e informe dados verdadeiros.</li>
          <li>Você é responsável pelas atividades realizadas na sua conta.</li>
          <li>Podemos suspender contas que violem estes termos.</li>
        </ul>
      </section>
      <section>
        <h2>4. Comunidade</h2>
        <ul>
          <li>A participação é opcional. É proibido publicar conteúdo ofensivo, discriminatório, enganoso, spam ou que exponha terceiros.</li>
          <li>Conteúdos denunciados podem ser ocultados e analisados pela moderação.</li>
          <li>Você pode bloquear usuários e controlar a visibilidade do seu perfil.</li>
        </ul>
      </section>
      <section>
        <h2>5. Planos e pagamentos</h2>
        <p>Planos pagos são cobrados de forma recorrente pelo processador de pagamentos indicado no checkout. Você pode cancelar a qualquer momento; o acesso permanece até o fim do período pago. Preços podem mudar com aviso prévio.</p>
      </section>
      <section>
        <h2>6. Gamificação</h2>
        <p>XP, níveis, conquistas e rankings não têm valor monetário e podem ser ajustados em caso de uso indevido ou manipulação.</p>
      </section>
      <section>
        <h2>7. Limitação de responsabilidade</h2>
        <p>A prática de atividade física envolve riscos. Respeite seus limites e interrompa qualquer atividade em caso de dor, tontura ou mal-estar. Na extensão permitida pela lei, o FitLife não se responsabiliza por lesões decorrentes do uso inadequado das informações.</p>
      </section>
      <section>
        <h2>8. Foro e legislação</h2>
        <p>Estes termos são regidos pelas leis brasileiras, incluindo o Código de Defesa do Consumidor quando aplicável.</p>
      </section>
    </LegalPage>
  );
}
