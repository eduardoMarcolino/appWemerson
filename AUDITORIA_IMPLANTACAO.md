# Auditoria de implantação — InteriorGo

**Data da revisão:** 19/10/2026
**Escopo:** estado atual do diretório de trabalho `D:\ProjetosEduardo\appWemerson`, incluindo API Laravel, apps Expo de passageiro e motorista, migrations, testes, Postman, CI e README.
**Conclusão:** **ainda não está pronto para operação pública ou produção.** O código é um protótipo funcional de fluxo de corrida e recebeu melhorias importantes, mas persistem bloqueios de produção em privacidade/exclusão de conta, configuração de produção, operação legal municipal, segurança e continuidade do rastreamento.

## Como ler esta auditoria

- **Confirmado no código:** comportamento diretamente observado nos arquivos citados.
- **Não confirmado no ZIP/diretório:** depende de console externo, credenciais, ambiente de implantação, política da loja ou processo da empresa; não concluo que exista ou não exista fora deste repositório.
- **Prioridade alta:** bloqueia ou pode causar risco relevante antes de liberar a usuários reais.
- **Prioridade média:** precisa ser resolvido para uma operação previsível, segura e sustentável.
- **Prioridade baixa:** melhoria de qualidade ou conveniência que não bloqueia o piloto controlado.

Esta é uma revisão técnica do repositório, não uma aprovação jurídica, de segurança independente, de loja de apps ou de infraestrutura. Não fiz deploy, não acessei Google Cloud/EAS/Play Console/App Store Connect e não executei a suíte. A API não contém `api/vendor/autoload.php`, então não foi possível usar comandos `artisan` neste ambiente. Os achados sobre configuração externa permanecem pendentes de confirmação.

## Resumo executivo

| Área | Situação observada | Prioridade geral |
|---|---|---|
| Fluxo básico de corrida | Cadastro, solicitação/agendamento, aceite, etapas de status, cancelamento pré-início, pagamento de teste e avaliações existem. | Média |
| Recuperação da corrida | O app consulta `/corridas/ativa`, mostra a aba global e atualiza por polling; depende de conexão e sessão lembrada para restaurar depois de fechar. | Média |
| Segurança e privacidade | Há hash de senha, Sanctum, validação, limites em login/cadastro e middleware de log sem payload; ainda há token sem expiração, dados excessivos no payload e ausência de processo/política de privacidade no app. | Alta |
| Produção e lojas | O perfil `preview` aponta para ngrok; o perfil `production` não configura a URL da API. Metadados completos, publicação e ambiente de produção não aparecem no repositório. | Alta |
| Operação de transporte | Aprovação manual existe, mas o código não comprova todos os documentos/requisitos federais e municipais nem uma operação de segurança/suporte. | Alta |
| Pagamento | Status e telas são de teste e afirmam que não processam cobrança. Integração real segue **adiada**, conforme instrução do proprietário. | Alta para produção; adiada por decisão explícita |
| Qualidade e CI | Há testes de fluxo/API e workflow para os testes Laravel e export Android dos dois apps. Não há testes automatizados dos apps nem publicação. | Média |

## 1. Funcionalidades do produto

### 1.1 Cadastro e autenticação — **Prioridade média**

**Confirmado:** há cadastro separado para passageiro e motorista, login por token Sanctum e limite de requisições nas rotas de cadastro/login. Senhas são armazenadas via `Hash::make`, e `UserModel::$hidden` oculta o campo `senha` ao serializar o usuário. Ver `api/routes/api.php:13-20`, `api/app/Http/Controllers/PassageiroController.php:22-79`, `api/app/Http/Controllers/MotoristaController.php:25-106` e `api/app/Models/UserModel.php:24-37`.

**Falta ou não está comprovado:** não há confirmação de e-mail/telefone; a recuperação de senha está ausente (o próprio login exibe “Esqueceu a senha?” como texto sem fluxo); as senhas de cadastro aceitam mínimo de seis caracteres. O cadastro do motorista coleta número e validade da CNH, veículo e placa, mas não prova a autenticidade desses dados.

**Próximo passo:** definir verificação de identidade/contato, recuperação segura de acesso e política de senha antes do piloto aberto. Manter aprovações e bloqueios operacionais auditáveis.

### 1.2 Solicitação, agendamento, aceite e acompanhamento — **Prioridade alta**

**Confirmado:** `CorridaController::store()` valida endereços, coordenadas, categoria e data futura; cria corrida e agendamento dentro de transação. `aceitar()` usa `lockForUpdate()` para impedir dois motoristas de aceitarem a mesma corrida simultaneamente. As transições de status são validadas em `transition()`. Ver `api/app/Http/Controllers/CorridaController.php:120-218`, `:222-257` e `:410-438`.

**Risco:** a API não impede um passageiro de abrir várias corridas ativas nem um motorista de aceitar corridas diferentes ao mesmo tempo. `/corridas/ativa` devolve só a corrida mais recente para cada papel (`CorridaController::ativa()`, linhas 47-80). Isso pode deixar outra solicitação/corrida sem acesso fácil na aba e cria conflito operacional.

**Próximo passo:** definir uma regra explícita (uma corrida ativa por passageiro e por motorista, ou fila suportada), aplicá-la transacionalmente no servidor e adicionar índice/constraint ou bloqueio consistente. Não depender só de botão desativado no app.

### 1.3 Corrida ativa acessível — **Prioridade média**

**Confirmado:** ambos os `App` consultam `/corridas/ativa` a cada cinco segundos e usam `ActiveRideSheet` global, fora da tela atual. Na inicialização, consultam a API para recuperar a corrida; a interface oferece abrir detalhes. Ver `appUser/App.js:70-80, 106-135`, `appMotorista/app.js:58-68, 101-123` e `appUser/pages/components/ActiveRideSheet.js:13-29, 86-122` (há versão equivalente no app do motorista).

**Limite:** o token e a sessão só são persistidos quando “Manter conectado neste dispositivo” está marcado (`appUser/pages/login/Login.js:16, 33, 68`; `appMotorista/pages/login/Login.js:16, 25, 56`; `appUser/pages/api.js::persistSession()` e `appMotorista/pages/api.js::persistSession()`). Sem essa opção, fechar o app encerra a sessão local e não há restauração automática da corrida até novo login. A recuperação também exige que a API esteja acessível; modo offline restaura sessão/cache sem a corrida ativa confirmada.

**Próximo passo:** tornar explícito ao usuário que a recuperação após fechar exige manter a sessão, ou revisar a experiência de sessão com armazenamento seguro e expiração definida. Testar fechamento forçado, reinício do aparelho, rede indisponível e sessão revogada.

### 1.4 Posição ao vivo — **Prioridade alta**

**Confirmado:** `appMotorista/pages/trip/Trip.js:14-57` envia a posição por GPS em foreground a cada cinco segundos somente quando a tela `Trip` está montada e o status é `EmAndamento`. O app do passageiro consulta a corrida a cada cinco segundos e anima o marcador em `MapPicker.native.js` e `SearchingDriver.js`.

**Risco:** a localização para quando o motorista sai da tela `Trip` ou quando o app fica em segundo plano/é fechado; não há serviço de localização em background nem serviço de push remoto. O passageiro pode ver uma posição antiga sem uma indicação clara de “última atualização”/idade do dado. Isso é importante para um fluxo de transporte e segurança.

**Próximo passo:** decidir e documentar o comportamento esperado quando o motorista navega para outra tela e quando o app fica em background. Implementar rastreamento foreground service/background somente se a operação realmente exigir e após cumprir as políticas de permissão e disclosure; enquanto isso, exibir horário/estado de posição desatualizada e evitar prometer rastreamento contínuo.

### 1.5 Cancelamento e incidentes — **Prioridade alta**

**Confirmado:** passageiro ou motorista participante podem cancelar uma corrida em `Solicitada`, `Aceita` ou `MotoristaChegando`; a API grava motivo opcional. Não é possível cancelar quando está `EmAndamento` (`CorridaController::cancelar()`, linhas 293-312). Não encontrei fluxo de SOS, suporte, denúncia, incidente, achados e perdidos ou protocolo de emergência nos arquivos examinados.

**Próximo passo:** definir regra operacional e legal para desistência após início, contingência/emergência e atendimento humano. Registrar motivos e eventos sem expor dados a terceiros. Não automatizar multa/taxa de cancelamento antes da decisão sobre dinheiro real.

### 1.6 Pagamento — **Prioridade alta; integração real adiada**

**Confirmado:** `CorridaController::pagar()` grava forma e status `Pago` e devolve `testOnly: true`, sem integrar gateway. `RideCatalog::paymentMethods()` chama cartão/carteira de simulado; a tela `Payment.js` avisa que não há cobrança. Ver `api/app/Http/Controllers/CorridaController.php:314-346`, `api/app/Support/RideCatalog.php:22-35` e `appUser/pages/payment/Payment.js`.

**Situação:** atende o modo de teste, mas não pode ser usado para cobrar, conciliar, liquidar ou calcular repasses reais. A distância e tarifa exibidas são estimativas: `CorridaController::distanceKm()` usa distância em linha reta (Haversine) e `RideCatalog::fareMultipliers()` aplica multiplicadores fixos (`api/app/Http/Controllers/CorridaController.php:483-492`; `api/app/Support/RideCatalog.php:22-25`). A tela `appMotorista/pages/earnings/Earnings.js` soma valor estimado das corridas finalizadas e chama isso de total/saldo de teste, não saldo pagável.

**Próximo passo:** manter a integração, carteira, cobrança e repasse **adiados** até autorização expressa. Antes disso, não apresentar `Pago`, “ganhos” ou método de pagamento como liquidação financeira real; planejar reconciliação, estornos, fraude e suporte separadamente quando a decisão for tomada.

### 1.7 Avaliações — **Prioridade média**

**Confirmado:** depois de corrida finalizada e pagamento marcado como pago, passageiro e motorista podem dar nota de 1 a 5; a migration permite uma avaliação por papel por corrida. Ver `CorridaController::avaliar()` em `api/app/Http/Controllers/CorridaController.php:348-389` e migration `api/database/migrations/2026_10_05_000001_add_trip_test_flow_fields.php`.

**Falta:** fluxo de denúncia/revisão de comentário, moderação e política de conteúdo não aparecem. Para corrida real, vincular avaliação ao participante correto e impedir exposição pública de informação pessoal.

**Próximo passo:** definir moderação, contestação, visibilidade e política de retenção; adicionar testes de acesso cruzado e duplicidade.

### 1.8 Notificações — **Prioridade alta**

**Confirmado:** os apps usam `expo-notifications` para notificações locais em eventos observados enquanto o app roda. O código declara que, sem permissão, status continua atualizando enquanto o app está aberto (`appUser/pages/searchingdriver/SearchingDriver.js:78-100`; `appMotorista/pages/home/Home.js:...`).

**Limite:** não há envio remoto ou servidor de push. Uma notificação local só pode ser agendada quando o aplicativo recebe a mudança; com app encerrado/sem polling, não garante aviso de corrida ou cancelamento.

**Próximo passo:** decidir as mensagens essenciais e montar push com tokens de dispositivo, expiração/remoção de tokens, consentimento, retry e monitoramento. Não coletar token de push antes de definir fornecedor, privacidade e política de retenção.

## 2. Segurança e privacidade

### 2.1 Dados pessoais são expostos além do necessário — **Prioridade alta**

**Confirmado:** `CorridaController::ridePayload()` retorna objetos Eloquent inteiros da corrida e do motorista carregado com `user` e `veiculos` (`api/app/Http/Controllers/CorridaController.php:466-480`). `UserModel` esconde apenas `senha`; CPF e e-mail continuam serializáveis (`api/app/Models/UserModel.php:35`). O modelo de corrida inclui telefone de beneficiário e `tokenCompartilhamento` (`api/database/migrations/0000_00_00_000013_create_tb_corrida_table.php:31-37`). Assim, o payload de corrida pode levar CPF/e-mail do motorista e campos de beneficiário/token para o outro participante sem um DTO/allowlist.

**Próximo passo:** substituir serialização de modelos completos por recursos/DTOs que retornem somente nome, veículo, placa e dados indispensáveis a cada papel. Não incluir CPF, e-mail, telefone de beneficiário ou token em listagens/histórico sem uma finalidade autorizada; escrever teste que prove quais campos cada papel recebe.

### 2.2 Token no AsyncStorage e sem expiração global — **Prioridade alta**

**Confirmado:** os apps gravam token e sessão em `@react-native-async-storage/async-storage` (`appUser/pages/api.js:89-112`; equivalente em `appMotorista/pages/api.js`). O token de Sanctum não tem expiração global: `api/config/sanctum.php:53` define `'expiration' => null`; a coluna `expires_at` pode existir, mas o código não fornece prazo ao criar os tokens.

**Próximo passo:** usar armazenamento de segredo do sistema operacional para o token, definir expiração/rotação/revogação para tokens e fluxo de reautenticação. Avaliar o que vai no cache offline: hoje respostas GET são guardadas por usuário em AsyncStorage e podem conter dados pessoais (`appUser/pages/api.js:143-175` e `appMotorista/pages/api.js:143-175`).

### 2.3 Exclusão de conta incompleta — **Prioridade alta; bloqueio provável de loja**

**Confirmado:** o botão é “Desativar conta”. `AccountController::deactivate()` marca `statusConta=Inativa`, remove tokens e foto, mas mantém perfil/tabelas e históricos (`api/app/Http/Controllers/AccountController.php:129-160`). Não encontrei página/web resource para solicitar exclusão depois de desinstalar o app nem política pública de retenção.

**Implicação:** Google Play pede caminho dentro do app e um recurso web para solicitar exclusão quando há criação de conta; Apple pede início da exclusão no app e distingue exclusão de simples desativação. Os critérios permitem retenção necessária por obrigação legal, mas ela deve ser explicada e delimitada. Consultar as regras oficiais atuais antes de submeter: [Google Play — exclusão de conta](https://support.google.com/googleplay/android-developer/answer/13327111?hl=pt-BR), [Apple — exclusão de conta](https://developer.apple.com/support/offering-account-deletion-in-your-app/).

**Próximo passo:** definir exclusão/anonymização e retenções legais com orientação jurídica; oferecer solicitação in-app e página web funcional, inclusive para dados enviados a fornecedores. Se determinados registros tiverem de permanecer, explicar quais, por quanto tempo e por quê.

### 2.4 Política LGPD e direitos do titular — **Prioridade alta**

**Confirmado no repositório:** dados coletados incluem CPF, e-mail, telefone, endereço, CNH, placa, foto e coordenadas/histórico de localização. Não encontrei política de privacidade, termos, registro de finalidades/bases legais, canal do titular, processo de exportação/correção/eliminação ou plano de incidentes nas telas/arquivos pesquisados.

**Próximo passo:** definir controlador/operadores e finalidade/base legal por dado; publicar política acessível no app e no site; documentar retenção, compartilhamentos (mapas, ViaCEP, Nominatim, hospedagem e push futuro), direitos e contato. Fazer inventário de dados e avaliar risco/necessidade de relatório de impacto. A LGPD estabelece princípios de finalidade, necessidade, transparência, segurança e prestação de contas; consulte o [texto compilado da LGPD](https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm) e o [guia da ANPD para agentes de pequeno porte](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/anonimizado___guia_orientat-_seg_da_inf_p_atpp.pdf).

### 2.5 Logging — melhoria implantada, controles operacionais pendentes — **Prioridade média**

**Confirmado:** `LogApiRequest` foi adicionado ao grupo `api` em `api/bootstrap/app.php:20-21`; grava hora, método, modelo da rota, usuário, IP, status e duração em canal diário separado, sem corpo, cabeçalhos ou query string (`api/app/Http/Middleware/LogApiRequest.php:16-49`; `api/config/logging.php:76-81`). Isso reduz vazamento de credenciais por log de requisição.

**Pendências:** IP e user ID continuam sendo dados pessoais; o arquivo fica em disco local com retenção padrão de 30 dias. Não vi teste específico do middleware, envio centralizado, alertas de falha, controle de leitura ou política de retenção aprovada. Além disso, `CorridaController::store()` registra a mensagem bruta de exceção (`CorridaController.php:195-200`); validar se erros SQL podem carregar valores sensíveis e reduzir esse log a identificadores/tipo de erro.

**Próximo passo:** restringir permissões do diretório, aprovar retenção, monitorar espaço e falhas, testar log de respostas 2xx/4xx/5xx e garantir que nenhum segredo apareça. Rever logs preexistentes, não apenas o novo middleware.

### 2.6 Proteção de conta e API — **Prioridade média**

**Pontos positivos confirmados:** rotas de negócio estão no grupo `auth:sanctum`; login/cadastro têm throttling; validação de campos existe; admin regenera a sessão ao autenticar; senha é hasheada; desativação e mudança de senha revogam tokens. Ver `api/routes/api.php:13-58`, `AdminAuthController::store()` e `AccountController::update()/deactivate()`.

**Pendências:** o throttling não aparece em rotas autenticadas, incluindo `/corridas/{id}/localizacao`; um motorista autenticado pode enviar pontos sem limite definido. Senhas de usuários aceitam seis caracteres, embora o Master CLI exija doze; não há segundo fator para admin nem auditoria explícita de alterações administrativas. Configure também `APP_DEBUG=false`, HTTPS e cookie seguro no ambiente de produção; `.env.example` tem `APP_DEBUG=true`, DB de exemplo `root` e não define `SESSION_SECURE_COOKIE` (`api/.env.example:2-4, 23-27`).

**Próximo passo:** limite por usuário e por corrida as atualizações de GPS, adote políticas de senha/admin adequadas, habilite HTTPS/cookies seguros e confira permissões de banco e storage no host real. `APP_DEBUG=true` e usuário `root` são exclusivamente exemplos de desenvolvimento.

## 3. Qualidade e organização do código

### 3.1 Regras e serialização concentradas em controller — **Prioridade média**

`CorridaController` concentra cadastro, agenda, matching, transições, cancelamento, pagamentos, avaliações, GPS, cálculo de preço e montagem de payload (`api/app/Http/Controllers/CorridaController.php:120-493`). Isso torna mais difícil testar regra isolada e manter consistência quando o produto cresce. Controllers também consultam modelos diretamente; não há evidência de Form Requests, Resources/DTOs ou serviços de domínio para esses fluxos.

**Próximo passo:** separar gradualmente validação, regras de estado, preço, pagamentos de teste, tracking e resposta de API; adicionar recursos/DTOs com contratos explícitos. Não precisa reescrever tudo antes de corrigir riscos de lançamento.

### 3.2 Consultas e crescimento de dados — **Prioridade média**

`passageiroIndex()`, `motoristaIndex()`, `ofertas()` e `agendadas()` usam `get()` sem paginação (`CorridaController.php:25-116`). Para cada corrida, `ridePayload()` consulta motorista, agendamento, pagamento e última localização (`:466-480`), o que pode gerar várias consultas por item e cresce com o histórico. Cada posição enviada cria uma linha em `tbLocalizacao`; a migration indexa `corridaId`/`motoristaId`, mas não define retenção ou limpeza (`api/database/migrations/0000_00_00_000016_create_tb_localizacao_table.php:14-24`).

**Próximo passo:** paginar histórico e ofertas, eager-load/batch de relações, medir consultas com dados de volume real e estabelecer retenção/arquivamento de pontos GPS. Adicionar throttling no endpoint de localização.

### 3.3 Consistência de modelo — **Prioridade baixa**

O legado contém controllers/models antigos com nomes e estilos diferentes (`admModel`, `UserModel`, controllers como `admController.php`). Alguns parecem não ser registrados nas rotas atuais, mas aumentam a chance de manutenção confundir caminhos ativos e legados.

**Próximo passo:** documentar rotas efetivamente suportadas, marcar/deprecar código legado e padronizar nomes em mudanças futuras, mantendo migrations e dados compatíveis.

## 4. Testes, erros e integração contínua

### 4.1 Cobertura existente — **Prioridade média**

**Confirmado:** há testes feature para fluxo de corrida, autorização, validação, sessões, desativação, fotos, agendamento, painel e limite de login (`api/tests/Feature/TripFlowTest.php`, `AdminPanelTest.php`, `ExampleTest.php`). `phpunit.xml` usa SQLite em memória. O workflow `.github/workflows/ci.yml` instala PHP 8.2, executa `php artisan test --compact` e faz `npx expo export --platform android` nos dois apps.

**Falta:** não encontrei testes automatizados de componentes/jornadas React Native, testes de polling/interpolação/sheet/restauração, teste do novo middleware de log, teste de carga/race de múltiplos motoristas nem CI para lint/análise estática/dependências/publicação. O export do Expo comprova bundle, não funcionamento de mapa, GPS, chave Google Maps ou APK em aparelho.

**Próximo passo:** adicionar cobertura de autorização campo a campo, corrida duplicada, limite de localização, estado ativo recuperado, terminal/cancelamento, log sem segredos e jornadas físicas Android. Manter builds em trilha de teste e registrar resultado por versão.

### 4.2 Tratamento de erro — **Prioridade média**

**Confirmado:** `bootstrap/app.php` substitui erros 5xx da API por mensagem genérica; clientes convertem erros HTTP em mensagem para tela (`appUser/pages/api.js` e `appMotorista/pages/api.js`). No polling, indisponibilidade temporária mantém a última corrida conhecida. Isso ajuda a não expor SQL ao usuário.

**Pendência:** ausência de observabilidade central/alerta significa que “erro interno” pode continuar invisível operacionalmente. A mensagem de exceção de `CorridaController::store()` é gravada no log geral. A expiração ou perda de GPS pode deixar o usuário vendo status antigo.

**Próximo passo:** definir IDs de correlação, alertas e runbook; mostrar timestamp/estado offline para localização e corrida; testar resposta 401/403/422/500 sem revelar dados pessoais.

## 5. Infraestrutura, publicação e implantação

### 5.1 Perfil de produção ainda não aponta para API publicada — **Prioridade alta / bloqueio**

**Confirmado:** `appUser/eas.json:11-23` e `appMotorista/eas.json:11-23` definem URL ngrok somente no perfil `preview`; `production` não define `EXPO_PUBLIC_API_URL`. `appUser/pages/api.js` e `appMotorista/pages/api.js` usam fallback local `10.0.2.2:8000` no Android e `localhost:8000` em outros alvos. Se não houver uma variável EAS de produção, o app publicado não alcançará a API de usuários.

**Próximo passo:** criar ambiente de produção com domínio/API HTTPS, definir `EXPO_PUBLIC_API_URL` para ambos os projetos, manter chave de mapa no ambiente correto e fazer build controlado. Confirmar no bundle final que nenhum endereço ngrok/local permaneceu.

### 5.2 Hospedagem e recuperação — **Prioridade alta**

**Confirmado no repositório:** não há Docker/compose, manifesto de hospedagem, infraestrutura como código, procedimentos de deploy/rollback, backups documentados, monitoramento, alertas ou configuração de banco gerenciado. O `.env.example` configura MySQL, sessões/cache/queue via database e `APP_DEBUG=true` para uso local.

**Não confirmado:** host, DNS, TLS, banco, credenciais EAS/Google, políticas de backup, disponibilidade e suporte podem existir fora do repositório; não tive acesso para verificar.

**Próximo passo:** escolher host e MySQL/MariaDB gerenciado, TLS, backups automáticos testados por restauração, rotina de migrations sem perda, storage persistente para fotos, métricas/alertas e rollback. Manter `.env` e segredos fora do Git; definir `APP_ENV=production`, `APP_DEBUG=false`, `LOG_LEVEL` e cookies seguros.

### 5.3 Chave Google Maps e builds — **Prioridade alta**

**Confirmado:** os `app.config.js` leem `GOOGLE_MAPS_API_KEY` e interrompem build EAS Android se a variável faltar; o código de mapa Android foi preparado. Os pacotes são `com.eduardocherubim.appuser` e `com.eduardocherubim.appmotorista`.

**Não confirmado:** não é possível conferir neste repositório se a chave existe, se Maps SDK for Android está habilitado, nem se restrições de pacote/SHA-1 correspondem às credenciais EAS. O CI só exporta bundle e não detecta mapa quebrado por chave/restrição.

**Próximo passo:** verificar em Google Cloud cada chave/restrição e o SHA-1 da credencial que assina o build de cada projeto; testar APK assinado em dispositivo físico e separar chaves/limites de preview e produção.

### 5.4 Google Play e App Store — **Prioridade alta**

**Confirmado:** os apps têm `android.package` e `projectId` EAS, mas os `app.json` examinados não declaram `name`, `slug`, `version`, ícone, `ios.bundleIdentifier` ou textos de permissão de localização. `eas.json` tem `submit.production` vazio; não há arte, screenshots, classificação etária, política de privacidade ou release checklist no repositório. Os `build.gradle` nativos versionam `versionCode 1`/`versionName 1.0.0` e apontam release para signing debug, embora `.easignore` exclua pastas nativas de builds EAS e o comportamento final de assinatura EAS dependa de credenciais externas.

**Próximo passo:** completar identidade/metadados dos dois apps, IDs Android/iOS definitivos, ícones, screenshots e disclosures; configurar credenciais de release e provar atualização sobre versão anterior. Configurar Data safety/deletion link e política. Se iOS estiver no escopo, criar bundle IDs e testar build iOS; nenhum iOS build foi verificado.

### 5.5 Dependências — **Prioridade média**

**Confirmado:** `package.json`/lockfiles declaram Expo SDK 57, React Native 0.86 e dependências de mapa/localização/notificações. O CI instala com `npm ci`, mas não executa auditoria de vulnerabilidades. O README antigo registrava um resultado anterior de `npm audit`; ele não constitui diagnóstico atual.

**Próximo passo:** executar auditoria atual de dependências em pipeline, revisar advisories e upgrades compatíveis por app, fixar versão de Node/Composer e guardar SBOM/relatório por release. Não usar `npm audit fix --force` sem revisão de compatibilidade.

## 6. Experiência do usuário — **Prioridade média**

**Pontos confirmados:** telas em português, temas claro/escuro, formatação de CPF/telefone/CEP, CEP via ViaCEP, busca de endereço Nominatim, seleção manual no mapa quando localização não é concedida, cache offline e aviso de dados desatualizados. A aba de corrida ativa minimizada/expandida e a posição inicial do passageiro foram implementadas.

**Pendências:** a aba motorista só aparece em status aceito/em chegada/em andamento; não acompanha solicitação ainda não aceita, o que parece intencional para o lado do motorista, mas deve ser validado. O status fora do app depende de polling e não há push remoto. A permissão GPS pode ser recusada e o tracking para fora da tela `Trip`; o cache pode conter endereço/identificadores. Não encontrei telas de termos/privacidade, acessibilidade auditada, suporte ou protocolo de segurança.

**Próximo passo:** teste moderado com passageiros e motoristas, aparelhos de baixa conectividade e GPS negado/desligado; validar leitura de status/data/valor, navegação por leitor de tela, erro e saída emergencial. Deixar claro quando dados são simulados ou desatualizados.

## 7. Aspectos legais e de operação no Brasil — **Prioridade alta**

A Lei 12.587/2012, alterada pela Lei 13.640/2018, atribui aos municípios e ao Distrito Federal a regulamentação/fiscalização do transporte remunerado privado individual. O texto prevê diretrizes como tributos municipais, seguros exigidos e inscrição do motorista como contribuinte individual; o art. 11-B menciona CNH categoria B ou superior com EAR, veículo conforme regras locais, CRLV e certidão negativa de antecedentes. Os detalhes variam conforme o município. Consulte [Lei 12.587/2012, arts. 11-A e 11-B](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12587.htm) e [Lei 13.640/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13640.htm).

**Comparação com o código:** `MotoristaController::cadastro()` grava CNH, validade e veículo, e `AdminController::updateAccount()` exige confirmação de documentos por checkbox e impede aprovar CNH vencida. Não vi campo/fluxo de EAR, upload/verificação de CNH, CRLV, antecedente criminal, seguro, requisito de idade do veículo, licença/registro municipal, tributos ou prova de contribuição previdenciária (`api/app/Http/Controllers/MotoristaController.php:41-68`; `AdminController.php:72-110`). O checkbox é evidência de confirmação manual, não evidência dos documentos ou da validade operacional deles. A categoria `Moto` também está disponível em `RideCatalog`; se for usada para transporte de passageiro, exige uma análise própria de regras federais/CONTRAN e locais para mototáxi, além das regras gerais de transporte por aplicativo. Como houve alterações normativas recentes, confirme o texto vigente e decisões aplicáveis antes do piloto. Consulte também a [Lei 12.009/2009](https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12009.htm) e a [Resolução CONTRAN 943/2022](https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucao9432022.pdf).

**Próximo passo:** escolher município piloto e validar com prefeitura/assessoria jurídica as regras vigentes, requisitos do motorista/veículo, seguros, tributos, registros e fiscalização. Criar checklist de onboarding e revalidação de documentos com trilha de auditoria, sem aprovar motorista apenas com declaração informal.

**Operação ainda não comprovada:** CNPJ/modelo contratual, termos do passageiro/motorista, seguros e sinistros, atendimento 24/7, canal de emergência, política de cancelamento, acessibilidade, suporte a incidentes, processo de bloqueio e rotina de auditoria de motoristas não aparecem no código. Classifico como **alta** porque afetam segurança, licitude e resposta a falhas; precisam ser definidos pelo operador local.

## 8. Plano de ação em ordem

1. **Alta — definir município e condições de operação.** Obter requisitos municipais e confirmar documentos, seguro, tributos, regras de motorista/veículo e forma de atendimento.
2. **Alta — fechar privacidade e exclusão.** Inventariar dados e fornecedores; definir base legal/finalidades/retenção; reduzir os payloads; publicar política; oferecer solicitação de exclusão dentro do app e pela web, respeitando retenções legais.
3. **Alta — preparar produção de verdade.** Hospedar API e banco com HTTPS, backup restaurável, storage durável, `APP_DEBUG=false`, secrets fora do Git, monitoramento, alertas, migrations e rollback documentados.
4. **Alta — corrigir isolamento e sessão.** DTOs/allowlists, token em armazenamento seguro, expiração/revogação, limitação do endpoint de GPS e testes de autorização/dados por papel.
5. **Alta — fechar corrida e localização.** Impedir múltiplas corridas concorrentes ou modelar isso integralmente; definir comportamento de cancelamento/incident response; garantir que o passageiro saiba quando a posição parou de atualizar.
6. **Alta — validar builds e lojas.** Configurar URL de produção e chave Google Maps, conferir package/SHA-1, metadados, ícones, IDs, política e formulários de privacidade/exclusão nas lojas. Testar APK assinado em dispositivos reais.
7. **Média — notificações e operação.** Implementar push remoto se necessário, escalonamento de suporte, monitoramento de corridas e procedimentos de contingência.
8. **Média — fortalecer qualidade.** Testes de integração concorrente, logging e privacidade; testes mobile/E2E; análise estática e auditoria de dependências no CI; paginação e métricas do banco.
9. **Adiado por instrução explícita — dinheiro real.** Não integrar cobrança, carteira ou repasse até autorização posterior. Antes de ativar, desenhar e testar conciliação, reembolso, chargeback, segurança e suporte.

## Referências oficiais consultadas

- [Lei 12.587/2012 — Política Nacional de Mobilidade Urbana, texto atualizado](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12587.htm)
- [Lei 13.640/2018 — transporte remunerado privado individual](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13640.htm)
- [Lei 12.009/2009 — atividade de mototaxista](https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12009.htm)
- [Resolução CONTRAN 943/2022 — requisitos mínimos para mototáxi/motofrete](https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucao9432022.pdf)
- [LGPD — Lei 13.709/2018, texto compilado](https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm)
- [ANPD — guia de segurança para agentes de tratamento de pequeno porte](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/anonimizado___guia_orientat-_seg_da_inf_p_atpp.pdf)
- [Google Play — requisito de exclusão de conta](https://support.google.com/googleplay/android-developer/answer/13327111?hl=pt-BR)
- [Google Play — formulário Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=pt-BR)
- [Apple — App Review Guidelines, privacidade e dados](https://developer.apple.com/app-store/review/guidelines/)
- [Apple — oferecer exclusão de conta](https://developer.apple.com/support/offering-account-deletion-in-your-app/)


