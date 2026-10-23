# Easy Notebook — instalar no Chrome

## [▶ ABRIR O GUIA DE INSTALAÇÃO](https://Rambond123.github.io/easy-notebook/)

**Para instalar ou enviar aos colegas, use o link acima.** Ele começa pelo download certo e mostra uma etapa por vez, com o botão procurado em destaque e a indicação da janela onde clicar.

O guia mantém o destino padrão de extração em **Downloads**. No Chrome, escolha **Downloads → Easy-Notebook-0.21.6 → Easy Notebook**. Mantenha essa pasta no computador; apenas o ZIP pode ser apagado. Não usa instalador `.exe` ou `.cmd`.

**Não use Code → Download ZIP nem Source code para instalar:** esses downloads contêm o projeto de desenvolvimento. O botão **Baixar Easy Notebook** dentro do guia entrega o pacote para usuários.

O ZIP de instalação contém `1 - INSTALAR NO CHROME.html` e a pasta `Easy Notebook`. Depois de extrair, abra esse HTML: ele começa diretamente na instalação no Chrome, sem repetir download e extração. Os arquivos de código ficam dentro da pasta Easy Notebook e não precisam ser abertos.

---

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

As chamadas do painel ao Chrome agora tratam tanto exceções síncronas quanto rejeições assíncronas por contexto invalidado. Ao detectar que a extensão foi recarregada, a aba antiga interrompe as verificações periódicas, desabilita ações e oferece Atualizar página. Chamadas do estado/progresso e da posição do botão usam a mesma proteção, evitando que o próprio tratamento de erro provoque outra exceção.

Validação: testes locais de invalidação síncrona/assíncrona e corrida durante a chamada; teste em Chromium isolado com runtime.reload real, aviso na aba antiga, zero erros não capturados após dois ciclos e atualização do documento pelo botão. Revalidados arraste/persistência e botão da capa com confirmar/cancelar. Abas que ainda estejam na versão anterior precisam de F5 para receber a correção.

## Botão na capa do eproc

Na capa do processo, o botão Easy Notebook é inserido na própria barra de ações, imediatamente depois de Imprimir. Ao clicar, a confirmação “Enviar o pdf completo ao Gemini Notebook?” aparece. Cancelar não inicia a tarefa. Confirmar inicia o envio existente (abrir a árvore, selecionar documentos, gerar e capturar PDF e transferir ao Notebook). Na capa não aparece um segundo botão flutuante. Na árvore e no Notebook, permanece o modo flutuante com a posição salva.

Validação: extensão carregada em Chromium com uma página simulada da capa. Conferidos posição ao lado de Imprimir, altura/alinhamento, preservação do Imprimir original, reinjeção após atualização da barra, início do fluxo em um clique e modo flutuante nas outras páginas. Não houve uma nova geração/upload de processo real nessa validação.

## Botão móvel

Arraste o botão Easy Notebook para qualquer ponto da janela. O arraste não abre o painel; um clique normal continua abrindo. A posição é salva neste perfil do navegador e compartilhada entre páginas do eproc e do Notebook, inclusive após recarregar. Ao mudar o tamanho da janela, botão e painel permanecem dentro da área visível. Também é possível mover com Alt + setas quando o botão está focado (Shift aumenta o passo). Em Configurações → Outras opções, use Restaurar posição do botão para voltar ao canto padrão.

Validação do botão móvel: Playwright com a extensão carregada em Chromium isolado e página de teste no domínio permitido. Aprovados arraste por ponteiro sem abrir o painel, clique normal, persistência após recarregar, restauração em outra guia, ajuste em janela menor, restauração do padrão e movimento pelo teclado. O usuário também confirmou o arraste na janela real do Chromium.

## Limpeza antes do envio

Em Configurações, marque **Remover as fontes atuais antes de enviar** e salve para substituir todas as fontes do notebook de destino a cada envio. A opção começa desativada. A exclusão é permanente e o painel indica quando a limpeza está ativada.

A extensão primeiro transfere e valida o PDF novo. Só depois lista as fontes atuais, registra seus identificadores e solicita a remoção de cada uma. A lista é consultada novamente para confirmar a exclusão antes do registro/upload do PDF novo. Em caso de falha, o PDF temporário e o andamento são preservados para retomada. Fontes adicionadas durante a limpeza, fora da seleção inicial, interrompem o fluxo e são preservadas.

A limpeza usa a operação `tGMBJ` da interface web do Notebook, documentada no projeto [notebooklm-py](https://github.com/teng-lin/notebooklm-py/blob/main/docs/rpc-reference.md). É um protocolo interno sujeito a mudanças do Google. Não usa uma API criada na conta TRF.

## Interface

Painel compacto com o envio principal em destaque, ferramentas do eproc recolhidas, biblioteca pesquisável, estados de sucesso/erro e acesso às configurações. Configurações organizadas por destino, biblioteca do Drive e prompts locais, com botão Salvar fixo. Ícone obtido dos recursos de marca servidos pelo próprio Notebook em `www.gstatic.com/tailwind/_/static/branding/v6/light_mode/favicon/`.

## Validação da versão 0.19

- Cinco suítes locais aprovadas: captura, fluxo eproc, upload, controlador e configurações.
- Casos de limpeza simulados: validação antes de excluir, resposta nula de exclusão, conferência por identificador, retomada de falha e preservação de fontes concorrentes.
- Interface e ícone verificados no Chromium com a extensão 0.19 carregada.
- Após autorização, a operação real de exclusão foi validada no notebook de teste: quatro fontes sintéticas removidas e ausência conferida no servidor. O PDF integral do processo foi preservado e continuou com status pronto. Não foi realizado outro upload nesse teste de limpeza. A integração completa de substituição + novo upload permanece coberta por simulação.

---

# Easy Notebook — versão 0.18

Extensão local para Chrome/Edge.

## Envio direto na versão 0.18

O PDF integral é capturado na sessão do eproc e preservado no armazenamento da extensão. A extensão abre uma guia nova do notebook configurado e envia os bytes diretamente ao serviço de upload do próprio Notebook, usando a sessão Google dessa guia. Não salva uma cópia em Downloads, não usa o botão do Drive, não abre seletor de arquivos e não precisa de auxiliar local nem de chave de API para enviar o PDF.

O link configurado pode conter `authuser=1` para escolher a conta Google. O código respeita a conta informada; não tenta outra conta silenciosamente. O PDF recebe o número do processo e o sufixo `- integral.pdf` quando seu nome de origem contém o número.

O envio só termina quando uma consulta ao Notebook confirma a fonte pelo identificador e seu estado pronto. Nesse momento, o PDF temporário é removido e a guia do Notebook fica em destaque, sem a janela de adicionar fontes. Se a resposta de uma criação ou upload for incerta, a extensão preserva o identificador e o arquivo, em vez de criar outra fonte automaticamente.

**Validação real:** a extensão 0.18 carregada no Chromium recebeu um PDF sintético de 1.250.718 bytes, abriu uma guia nova, enviou o arquivo, confirmou fonte pronta, descartou o pendente e não criou nenhum download local. A fonte foi conferida na interface. O trecho capa → árvore → gerar PDF integral não foi repetido nessa rodada porque a sessão do eproc expirou ao reiniciar o navegador de teste.

O protocolo de upload é interno ao Notebook e pode mudar. Referência de pesquisa: [ScholarRelay](https://github.com/mahlernim/scholar-relay/blob/main/notebooklm-api.js) e [documentação de upload do notebooklm-mcp](https://github.com/yasinyuksel/notebooklm-mcp/blob/main/FILE_UPLOAD_IMPLEMENTATION.md). As notas de versões anteriores abaixo são históricas e não descrevem o fluxo atual.

## Instalar a partir do código (desenvolvimento)

1. Abra `chrome://extensions` no Chrome normal.
2. Ative **Modo do desenvolvedor** e clique em **Carregar sem compactação**.
3. Selecione esta pasta: `C:\EPROC GERAL\EPROC Gab 51\Ferramentas\easy notebook`.
4. Clique no ícone Easy Notebook, configure o link de um notebook específico e salve.
5. Recarregue as páginas do eproc e do Notebook após instalar/atualizar a extensão.

### Instalação guiada para usuários finais

Envie o [guia de instalação](https://Rambond123.github.io/easy-notebook/) ao usuário. Ele oferece o download do pacote, orienta a manter a extração padrão em Downloads e acompanha cada ação no Chrome. Há um botão funcional para copiar o endereço da tela de extensões. As figuras são identificadas como referências visuais, não como botões que controlam o navegador.

O Chrome exige que o próprio usuário ative o modo do desenvolvedor e confirme a pasta. Uma página comum não pode clicar nos controles de `chrome://extensions` nem instalar silenciosamente uma extensão fora da Chrome Web Store.

O pacote público é gerado por `distribuicao/criar-pacote.ps1`. O guia local é derivado de `docs/index.html`, excluindo as três etapas anteriores à instalação, inclusive da navegação Voltar. O pacote não contém `.exe`, `.cmd`, `.bat` ou PowerShell. Para validar o guia no navegador: `node distribuicao/testar-guia.cjs` (Playwright instalado; ou informe seu diretório em `PLAYWRIGHT_MODULE`). Para validar o HTML extraído do ZIP, informe seu caminho em `GUIDE_FILE`.

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

## Estado da validação

Verificações de sintaxe e estrutura local são feitas na entrega. A extensão ainda precisa ser carregada no Chrome e testada de ponta a ponta. O teste anterior com automação confirmou upload de um PDF salvo, mas não valida este código da extensão.

## Próximas etapas

- Testar captura autenticada do PDF no Chrome.
- Testar o reconhecimento do arquivo pelo campo de upload e a conclusão do processamento.
- Validar o fluxo automático completo no Chrome instalado.
- Suporte a Google Docs e edição de prompts locais existentes.



## Correção 0.3

A busca de Marcar todos prioriza aria-label para não duplicar o nome do botão. A geração verifica o total selecionado na árvore antes da impressão. A tarefa é preservada durante páginas intermediárias de redirecionamento. O painel mostra a contagem de documentos. Após capturar e validar o PDF, a transferência salva uma cópia em Downloads e confirma sua conclusão antes de abrir o notebook. Recarregue a extensão e atualize as abas do eproc; o painel deve mostrar 0.3. Os testes locais simulam os atributos observados na página real, mas a extensão instalada ainda precisa de validação de ponta a ponta.



## Ajustes 0.4

Salvar configurações fica em uma barra fixa no topo com confirmação de horário. Campos opcionais podem ficar vazios. A pasta de salvamento é a pasta padrão de downloads do navegador; o botão Salvar cópia também usa a API de downloads com saveAs false. O botão Abrir pasta de downloads facilita localizar o PDF. Marcar todos manual e geração automática usam a mesma rotina, incluindo verificação da seleção dos documentos. O botão nativo Marcar todos do eproc é um link com uma imagem estática; a confirmação é a marcação de cada documento e a contagem mostrada pela extensão.


## Versão 0.12

O notebook abre sempre em guia nova, com o envio vinculado somente a essa guia. A transferência automática fica em segundo plano, é exibida se falhar e é fechada após o arquivo aparecer no notebook. O download usa diretamente a URL autenticada do PDF com saveAs false, sem nome personalizado, para usar o nome do servidor e a pasta padrão do navegador. Confirmar a ausência do diálogo de salvamento no teste real.


## Versão 0.14 — captura na árvore

O fluxo principal não abre transfer.html. Após a geração, o script da árvore busca a URL do leitor na própria origem do eproc com a sessão atual, valida o PDF, transmite blocos de 512 KiB e grava o arquivo reconstruído no IndexedDB da extensão. A guia nova do notebook recebe esse arquivo temporário. A cópia em Downloads é uma operação independente: um diálogo ou falha no download não é pré-requisito do envio. O salvamento automático sem diálogo e a anexação no Notebook continuam dependendo de validação no navegador do usuário. O caminho de PDF já salvo continua disponível na configuração.

Validação local: test-capture.mjs reconstrói um PDF simulado de três blocos e compara todos os bytes; test-flow.mjs e test-upload.mjs usam interfaces simuladas. Esses testes não comprovam a integração ao vivo.

