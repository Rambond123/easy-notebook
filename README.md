# Easy Notebook

Extensão para Chrome que envia o PDF completo de um processo do eproc ao Google Notebook e oferece uma biblioteca de prompts dentro do chat do Notebook.

## Instalar

**Usuários:** instalem pelo pacote `Easy-Notebook-<versão>.zip`, não pelo código deste repositório.

**Desenvolvimento:**

1. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
2. Clique em **Carregar sem compactação** e selecione a pasta deste repositório.
3. Recarregue (F5) as abas do eproc e do Notebook já abertas.

Requisitos: Chrome 120 ou superior, com o eproc e a conta Google conectados no mesmo perfil do navegador.

## Configurar

No ícone da extensão, abra as configurações e informe o link de um notebook específico. Se houver mais de uma conta Google no navegador, mantenha o parâmetro `authuser` no link.

## Usar

**Enviar o processo:** na capa do processo, clique em **Easy Notebook** (ao lado de Imprimir) e confirme. A extensão abre a árvore de documentos, marca todos, gera o PDF integral e o envia ao notebook configurado. Aguarde até a fonte aparecer como pronta.

**Prompts:** no Notebook, o botão **Prompts** fica à esquerda do campo de conversa e insere o texto escolhido no chat, sem enviar. Os prompts podem ser cadastrados nas configurações ou importados da Gaia (**Configurações → Importar prompts da Gaia**, com a biblioteca da Gaia aberta no eproc).

**Opções:** nas configurações é possível substituir todas as fontes do notebook a cada envio (exclusão permanente, desativada por padrão), enviar um PDF já salvo no computador e restaurar a posição do botão.

## Gerar o pacote de instalação

Execute `distribuicao/criar-pacote.ps1` para gerar `pacotes/Easy-Notebook-<versão>.zip`, usando a versão do `manifest.json`. O guia de instalação fica em `docs/index.html`.

## Limitações

- O envio usa protocolos internos do Notebook, que o Google pode mudar sem aviso.
- Limite de 200 MB por PDF.
- O PDF vai direto do navegador para o Notebook; não há servidor intermediário.
