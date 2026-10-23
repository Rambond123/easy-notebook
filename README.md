# Easy Notebook 0.20.3

## Estado de geração persistente

O painel agora controla a geração pelo estado real da tarefa. Mensagens intermediárias de captura e transferência não fazem o botão **Enviar processo ao Notebook** reaparecer. Ele permanece oculto durante toda a geração e, após a captura bem-sucedida, o painel mostra **Geração concluída**. Em caso de falha, o estado é encerrado e o botão volta para permitir nova tentativa.

---

# Easy Notebook 0.20.2

## Aviso de geração na árvore

Durante a geração automática na árvore de documentos, o painel permanece aberto com o aviso **AGUARDE — gerando o PDF completo**. O aviso usa fundo vermelho forte, texto branco e indicador de atividade. A mensagem informa que não é necessário clicar novamente e acompanha as etapas de seleção dos documentos, montagem do PDF pelo eproc e preparação da transferência.

Enquanto a geração estiver em andamento, o botão **Enviar processo ao Notebook** fica oculto e o título da área muda para **Geração em andamento**. Se houver falha, o botão volta a aparecer para permitir uma nova tentativa.

---

# Easy Notebook 0.20.1

## Botão somente em processos individuais

No eproc, a interface da extensão só é criada quando a página representa um processo individual. A capa do processo, a árvore e o leitor de documentos continuam atendidos. Localizadores, listas de processos, painéis, relatórios e páginas gerais do sistema não exibem o botão, mesmo quando a URL contém um número usado apenas como filtro.

A identificação considera o número CNJ da URL e marcadores próprios das páginas de detalhes e documentos. No Google Notebook, a biblioteca de prompts continua disponível normalmente.

---

# Easy Notebook 0.19.4

## Atualização da extensão com abas abertas





## Botão na capa do eproc

Na capa do processo, o botão Easy Notebook é inserido na própria barra de ações, imediatamente depois de Imprimir. Ao clicar, a confirmação “Enviar o pdf completo ao Gemini Notebook?” aparece. Cancelar não inicia a tarefa. Confirmar inicia o envio existente (abrir a árvore, selecionar documentos, gerar e capturar PDF e transferir ao Notebook). Na capa não aparece um segundo botão flutuante. Na árvore e no Notebook, permanece o modo flutuante com a posição salva.



## Botão móvel

Arraste o botão Easy Notebook para qualquer ponto da janela. O arraste não abre o painel; um clique normal continua abrindo. A posição é salva neste perfil do navegador e compartilhada entre páginas do eproc e do Notebook, inclusive após recarregar. Ao mudar o tamanho da janela, botão e painel permanecem dentro da área visível. Também é possível mover com Alt + setas quando o botão está focado (Shift aumenta o passo). Em Configurações → Outras opções, use Restaurar posição do botão para voltar ao canto padrão.



## Limpeza antes do envio

Em Configurações, marque **Remover as fontes atuais antes de enviar** e salve para substituir todas as fontes do notebook de destino a cada envio. A opção começa desativada. A exclusão é permanente e o painel indica quando a limpeza está ativada.

A extensão primeiro transfere e valida o PDF novo. Só depois lista as fontes atuais, registra seus identificadores e solicita a remoção de cada uma. A lista é consultada novamente para confirmar a exclusão antes do registro/upload do PDF novo. Em caso de falha, o PDF temporário e o andamento são preservados para retomada. Fontes adicionadas durante a limpeza, fora da seleção inicial, interrompem o fluxo e são preservadas.

A limpeza usa a operação `tGMBJ` da interface web do Notebook, documentada no projeto [notebooklm-py](https://github.com/teng-lin/notebooklm-py/blob/main/docs/rpc-reference.md). É um protocolo interno sujeito a mudanças do Google. Não usa uma API criada na conta TRF.

## Interface

Painel compacto com o envio principal em destaque, ferramentas do eproc recolhidas, biblioteca pesquisável, estados de sucesso/erro e acesso às configurações. Configurações organizadas por destino, biblioteca do Drive e prompts locais, com botão Salvar fixo. Ícone obtido dos recursos de marca servidos pelo próprio Notebook em `www.gstatic.com/tailwind/_/static/branding/v6/light_mode/favicon/`.





---

# Easy Notebook — versão 0.18

Extensão local para Chrome/Edge.

## Envio direto na versão 0.18

O PDF integral é capturado na sessão do eproc e preservado no armazenamento da extensão. A extensão abre uma guia nova do notebook configurado e envia os bytes diretamente ao serviço de upload do próprio Notebook, usando a sessão Google dessa guia. Não salva uma cópia em Downloads, não usa o botão do Drive, não abre seletor de arquivos e não precisa de auxiliar local nem de chave de API para enviar o PDF.

O link configurado pode conter `authuser=1` para escolher a conta Google. O código respeita a conta informada; não tenta outra conta silenciosamente. O PDF recebe o número do processo e o sufixo `- integral.pdf` quando seu nome de origem contém o número.

O envio só termina quando uma consulta ao Notebook confirma a fonte pelo identificador e seu estado pronto. Nesse momento, o PDF temporário é removido e a guia do Notebook fica em destaque, sem a janela de adicionar fontes. Se a resposta de uma criação ou upload for incerta, a extensão preserva o identificador e o arquivo, em vez de criar outra fonte automaticamente.



O protocolo de upload é interno ao Notebook e pode mudar. Referência de pesquisa: [ScholarRelay](https://github.com/mahlernim/scholar-relay/blob/main/notebooklm-api.js) e [documentação de upload do notebooklm-mcp](https://github.com/yasinyuksel/notebooklm-mcp/blob/main/FILE_UPLOAD_IMPLEMENTATION.md). As notas de versões anteriores abaixo são históricas e não descrevem o fluxo atual.

## Instalar

1. Abra `chrome://extensions` no Chrome normal.
2. Ative **Modo do desenvolvedor** e clique em **Carregar sem compactação**.
3. Selecione esta pasta: `C:\EPROC GERAL\EPROC Gab 51\Ferramentas\easy notebook`.
4. Clique no ícone Easy Notebook, configure o link de um notebook específico e salve.
5. Recarregue as páginas do eproc e do Notebook após instalar/atualizar a extensão.

### Instalação guiada para usuários finais

1. Baixe e extraia todo o ZIP da Easy Notebook.
2. Execute **Instalar Easy Notebook.cmd**.
3. O instalador copia somente os arquivos necessários para a pasta Documentos do usuário atual, em `Eprocando\Easy Notebook`. O local é obtido do próprio Windows e funciona também quando Documentos está redirecionado para o OneDrive.
4. O Chrome abre a tela de extensões e um guia visual. O caminho da pasta fica copiado para ser colado na janela de **Carregar sem compactação**.

O Chrome exige que o próprio usuário ative o modo do desenvolvedor e confirme a pasta. Uma página comum não pode clicar nos controles de `chrome://extensions` nem instalar silenciosamente uma extensão fora da Chrome Web Store.

## Prompts

O botão flutuante Easy Notebook abre a biblioteca. Cadastre prompts locais na configuração. **Usar** preenche a conversa e não envia a pergunta. Abra a aba Chat antes de inserir.

Para Drive, informe a pasta compartilhada para leitura e uma chave de API com Google Drive API ativada. Use um arquivo `.txt` ou `.md` por prompt. Google Docs ainda não é aceito nesta versão. A chave fica no armazenamento local da extensão; restrinja-a à API do Drive e defina cotas no Google Cloud.

**Atualizar prompts** busca a biblioteca diretamente no painel. **Abrir pasta no Drive** abre a pasta para edição. A atualização só substitui a biblioteca quando todos os arquivos são recebidos. Uma pasta vazia mantém a biblioteca anterior. Prompts locais são preservados. O conteúdo remoto é tratado como texto, nunca como código.

## PDF do eproc

1. Na capa do processo, clique em **Enviar processo ao Notebook**.
2. A extensão abre a árvore dos relacionados ou das ferramentas e continua na nova aba.
3. Marca todos, aciona a versão de impressão e aceita os avisos JavaScript síncronos dessa geração.
4. Aguarda o novo PDF completo por até 3 minutos e abre a transferência com captura automática.
5. Se a captura funcionar, destaca o notebook e tenta anexar o PDF. Confira o processamento nas fontes.

Alternativa: na configuração clique em **Selecionar PDF**, escolha o arquivo já salvo e clique em **Enviar PDF selecionado**.

Captura e anexação são experimentais: cookies de sessão, alterações na interface ou eventos de arquivo rejeitados pelo site podem impedir o fluxo. A presença do nome na página é uma confirmação parcial; confira que a fonte terminou de processar. Não há envio automático de prompts. Limite local do protótipo: 200 MB por PDF.

O arquivo pendente fica temporariamente no IndexedDB da extensão e é removido após o nome aparecer na página ou ao preparar outro arquivo. Sem confirmação ele permanece para nova tentativa. Nenhum servidor próprio recebe o PDF; o destino do upload é o notebook configurado. Não são gravadas URLs autenticadas do eproc em logs ou em configuração permanente.





## Próximas etapas





## Correção 0.3





## Ajustes 0.4

Salvar configurações fica em uma barra fixa no topo com confirmação de horário. Campos opcionais podem ficar vazios. A pasta de salvamento é a pasta padrão de downloads do navegador; o botão Salvar cópia também usa a API de downloads com saveAs false. O botão Abrir pasta de downloads facilita localizar o PDF. Marcar todos manual e geração automática usam a mesma rotina, incluindo verificação da seleção dos documentos. O botão nativo Marcar todos do eproc é um link com uma imagem estática; a confirmação é a marcação de cada documento e a contagem mostrada pela extensão.


## Versão 0.12




## Versão 0.14 — captura na árvore





