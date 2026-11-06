import type { Metadata } from "next";
import { LegalPage } from "../legal";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade" updated="6 de novembro de 2026">
      <section>
        <h2>1. Quem somos</h2>
        <p>O FitLife é uma plataforma de organização de treinos, alimentação, hábitos e evolução física. Esta política explica como tratamos dados pessoais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>
      </section>
      <section>
        <h2>2. Dados que coletamos</h2>
        <ul>
          <li>Cadastro: nome, e-mail e senha (armazenada apenas como hash Argon2id).</li>
          <li>Perfil: data de nascimento, sexo (opcional), altura, peso, objetivos, preferências e restrições alimentares, equipamentos e disponibilidade.</li>
          <li>Dados de saúde e corporais (dados sensíveis): medidas, percentual de gordura, fotos de evolução, registros de sono, cansaço e dor percebida, e a indicação de condições de saúde.</li>
          <li>Uso: treinos, séries, refeições, hábitos, eventos do calendário, metas, conquistas e mensagens trocadas com o Fit AI.</li>
          <li>Segurança: endereço IP, agente do navegador e registros de auditoria de ações sensíveis.</li>
        </ul>
      </section>
      <section>
        <h2>3. Finalidades e bases legais</h2>
        <ul>
          <li>Prestar o serviço contratado (execução de contrato — art. 7º, V).</li>
          <li>Tratar dados de saúde exclusivamente para as funcionalidades que você utiliza, mediante consentimento específico e destacado (art. 11, I), registrado no cadastro.</li>
          <li>Segurança, prevenção a fraudes e registros de acesso (legítimo interesse e obrigação legal — Marco Civil da Internet).</li>
          <li>Comunicações de marketing somente com consentimento, revogável nas configurações.</li>
        </ul>
      </section>
      <section>
        <h2>4. Proteção reforçada para dados sensíveis</h2>
        <ul>
          <li>Fotos de evolução são privadas por padrão, armazenadas fora da área pública e servidas apenas a você, com sessão autenticada.</li>
          <li>Cada usuário acessa somente os próprios dados; as permissões são verificadas no servidor em todas as requisições.</li>
          <li>O Fit AI só usa seu histórico se você autorizar, e você pode revogar a qualquer momento.</li>
        </ul>
      </section>
      <section>
        <h2>5. Compartilhamento</h2>
        <p>Não vendemos dados pessoais. Podemos utilizar operadores para hospedagem, envio de e-mails, processamento de pagamentos (ex.: Stripe) e, se habilitado, processamento de linguagem natural (ex.: Anthropic) — sempre limitados ao necessário para a funcionalidade. Publicações na comunidade são visíveis conforme a privacidade escolhida por você.</p>
      </section>
      <section id="lgpd">
        <h2>6. Seus direitos (art. 18 da LGPD)</h2>
        <ul>
          <li>Confirmação e acesso: veja seus dados na plataforma ou exporte-os em Configurações → Privacidade.</li>
          <li>Portabilidade: exportação completa em formato JSON.</li>
          <li>Correção: edite perfil, medidas e registros a qualquer momento.</li>
          <li>Eliminação: exclua sua conta em Configurações → Privacidade; os dados pessoais são removidos de forma definitiva.</li>
          <li>Revogação de consentimento e gerenciamento de preferências (comunidade, uso do histórico pelo Fit AI, e-mails).</li>
        </ul>
      </section>
      <section>
        <h2>7. Retenção</h2>
        <p>Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão, registros de auditoria são mantidos de forma desvinculada da sua identidade pelo prazo legal aplicável.</p>
      </section>
      <section>
        <h2>8. Contato</h2>
        <p>Para exercer direitos ou tirar dúvidas, contate o encarregado de dados (DPO) pelo canal oficial indicado pela empresa responsável pela operação do FitLife.</p>
      </section>
    </LegalPage>
  );
}
