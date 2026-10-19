# InteriorGo

Protótipo de mobilidade urbana para cidades pequenas, composto por uma API Laravel e dois aplicativos Expo: passageiro e motorista. O projeto permite testar cadastro, solicitação e agendamento de corridas, aceite e acompanhamento, cancelamento, pagamento simulado e avaliações.

> **Estado do projeto:** destinado a desenvolvimento e testes. O pagamento é simulado; não há cobrança, carteira, repasse nem integração com gateway. O ngrok usado nos testes não substitui uma API de produção.

## Índice

- [Estrutura do repositório](#estrutura-do-repositório)
- [Tecnologias e requisitos](#tecnologias-e-requisitos)
- [Configuração e execução da API](#configuração-e-execução-da-api)
- [Configuração e execução dos aplicativos](#configuração-e-execução-dos-aplicativos)
- [Acesso por aparelho físico e túnel ngrok](#acesso-por-aparelho-físico-e-túnel-ngrok)
- [Mapas e localização](#mapas-e-localização)
- [Gerar APK de teste com EAS](#gerar-apk-de-teste-com-eas)
- [Testes e integração contínua](#testes-e-integração-contínua)
- [Fluxo manual de teste](#fluxo-manual-de-teste)
- [Recursos e limitações atuais](#recursos-e-limitações-atuais)
- [Antes de uma implantação real](#antes-de-uma-implantação-real)

## Estrutura do repositório

```text
InteriorGo/
├── api/              API Laravel, painel web administrativo e migrations
├── appUser/          Aplicativo Expo do passageiro
├── appMotorista/     Aplicativo Expo do motorista
├── postman/          Coleção de requisições para teste da API
├── .github/workflows/ci.yml
└── README.md
```

As migrations em `api/database/migrations` definem o esquema do banco. Os dois apps têm configuração Expo, dependências e `eas.json` próprios; execute os comandos dentro da pasta do app correspondente.

## Tecnologias e requisitos

- **API:** PHP 8.2 ou superior, Laravel 12, Composer e MySQL/MariaDB para execução local.
- **Painel/API assets:** Node.js e npm, Vite.
- **Aplicativos:** Node.js e npm; Expo SDK 57, React Native 0.86 e `react-native-maps` 1.27 (versões declaradas nos manifests dos apps).
- **Build Android:** conta e CLI do EAS, projeto EAS associado a cada app e chave Google Maps configurada.
- **Desenvolvimento em aparelho:** computador e telefone na mesma Wi-Fi, ou API HTTPS acessível pelo telefone.

## Configuração e execução da API

Abra um terminal PowerShell na raiz e prepare o ambiente:

```powershell
cd api
Copy-Item .env.example .env
composer install
php artisan key:generate
```

Crie um banco vazio no MySQL/MariaDB e ajuste no arquivo `api/.env` pelo menos:

| Variável | Para que serve | Exemplo local do `.env.example` |
|---|---|---|
| `APP_ENV` | ambiente da aplicação | `local` |
| `APP_DEBUG` | detalhes de erro | `true` local; use `false` fora de desenvolvimento |
| `APP_URL` | endereço da API | `http://localhost` |
| `DB_CONNECTION` | driver do banco | `mysql` |
| `DB_HOST` / `DB_PORT` | servidor e porta do banco | `127.0.0.1` / `3306` |
| `DB_DATABASE` | banco que você criou | `api` |
| `DB_USERNAME` / `DB_PASSWORD` | credenciais do banco | conforme sua instalação |

Aplique as migrations, crie o link público de fotos e inicie o servidor:

```powershell
php artisan migrate
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000
```

O servidor de desenvolvimento fica em `http://127.0.0.1:8000`; o endpoint de saúde é `/up`. Para o painel web, abra `/admin/login`. Para criar o primeiro administrador Master, execute em outro terminal dentro de `api`:

```powershell
php artisan admin:create-master
```

O ambiente `local` aprova automaticamente motoristas cadastrados para facilitar testes. Fora de `local` e `testing`, os novos motoristas ficam pendentes de aprovação.

### Assets do painel administrativo (opcional)

Se precisar gerar os assets Vite do painel:

```powershell
cd api
npm ci
npm run build
```

O pacote npm da API também contém `npm run dev:ngrok`, explicado adiante. Ele não inicia o servidor Laravel.

### Variáveis opcionais de log

As requisições à API são registradas no canal diário `api_requests`, em `api/storage/logs/api-requests-AAAA-MM-DD.log`, com retenção padrão de 30 dias. Opcionalmente, ajuste no `.env` da API:

```dotenv
LOG_API_REQUESTS_LEVEL=info
LOG_API_REQUESTS_DAYS=30
```

O middleware registra método, modelo da rota, identificador do usuário autenticado quando disponível, IP, status e duração. Não grava corpo, cabeçalhos nem query string. O IP e o identificador da conta ainda são dados que devem ter acesso restrito.

## Configuração e execução dos aplicativos

Cada aplicativo usa `EXPO_PUBLIC_API_URL` como origem da API; o código acrescenta `/api`. Sem a variável, o padrão é `http://10.0.2.2:8000` no Android e `http://localhost:8000` nos demais alvos. O endereço `10.0.2.2` atende emulador Android, não aparelho físico.

Instale e inicie cada app em seu próprio terminal:

```powershell
cd appUser
npm ci
npm start
```

```powershell
cd appMotorista
npm ci
npm start
```

Leia o QR code com Expo Go para desenvolvimento. Para limpar o cache do Expo em caso de problema de bundle:

```powershell
npx expo start --clear
```

Para apontar um app local para um servidor acessível na rede, defina a URL **antes** de iniciar o Expo. Use o IPv4 do computador, não o exemplo literal:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.0.14:8000"
cd appUser # ou appMotorista
npm start
```

A API deve continuar rodando, o computador e o aparelho devem estar na mesma rede, e o firewall do Windows precisa permitir a porta 8000. Os apps têm timeout de requisição de 15 segundos.

## Acesso por aparelho físico e túnel ngrok

Para testar fora da rede local, o repositório inclui um túnel de desenvolvimento ngrok. O Laravel continua rodando localmente na porta 8000; o túnel apenas publica essa porta. Em um primeiro terminal:

```powershell
cd api
php artisan serve --host=0.0.0.0 --port=8000
```

Em outro terminal, informe o authtoken fornecido pela conta ngrok sem gravá-lo no código ou em arquivo versionado e inicie o túnel:

```powershell
cd api
npm ci
$env:NGROK_AUTHTOKEN = Read-Host -Prompt "Authtoken ngrok"
$env:NGROK_ADDR = "localhost:8000"
$env:NGROK_DOMAIN = "reviver-resurrect-silver.ngrok-free.dev"
npm run dev:ngrok
```

O domínio configurado precisa estar reservado na conta vinculada ao authtoken. Mantenha os dois processos ativos e confira `https://reviver-resurrect-silver.ngrok-free.dev/up`. Se mudar o domínio, atualize o `NGROK_DOMAIN` e os valores de API em `appUser/eas.json` e `appMotorista/eas.json`.

Para iniciar um app local apontando para o túnel:

```powershell
$env:EXPO_PUBLIC_API_URL = "https://reviver-resurrect-silver.ngrok-free.dev"
cd appUser # ou appMotorista
npm start
```

O perfil EAS `preview` já aponta para esse domínio e ignora a página intermediária de aviso do plano gratuito. Gere o APK e teste enquanto o servidor e túnel estiverem ativos. Esse serviço é para testes e não deve ser tratado como hospedagem de produção.

## Mapas e localização

Os mapas Android usam `react-native-maps` com Google Maps; a localização usa `expo-location`. O app do passageiro solicita permissão para centralizar o seletor de local. O motorista precisa permitir localização durante a corrida. Se a permissão for negada, alguns fluxos continuam com seleção manual, mas o rastreamento depende do GPS.

Para APK Android, crie uma chave no Google Cloud, habilite **Maps SDK for Android** e restrinja a chave aos pacotes e certificados corretos:

- Passageiro: `com.eduardocherubim.appuser`.
- Motorista: `com.eduardocherubim.appmotorista`.

Obtenha o SHA-1 de cada credencial em sua pasta de app com `npx eas-cli@latest credentials -p android`. Cadastre `GOOGLE_MAPS_API_KEY` como variável secreta do ambiente EAS usado pelo build. Exemplo para o perfil `preview` do app do passageiro:

```powershell
cd appUser
npx eas-cli@latest env:create --name GOOGLE_MAPS_API_KEY --value "SUA_CHAVE" --environment preview --visibility secret
```

Repita no projeto EAS do motorista. Uma chave pode atender os dois apps se as restrições incluírem ambos os pacotes e SHA-1; chaves separadas também funcionam. Não coloque a chave em arquivos versionados.

Para build Android local, defina a chave no terminal antes de gerar os arquivos nativos:

```powershell
$env:GOOGLE_MAPS_API_KEY = "SUA_CHAVE"
npx expo prebuild --platform android
npx expo run:android
```

O app do motorista e o app do passageiro têm `app.config.js` próprio e exigem a chave em qualquer build EAS Android. A configuração atual documenta os segredos do perfil `preview`; antes de usar o perfil EAS `production`, configure também nesse ambiente a URL HTTPS definitiva da API e a chave de mapas. **Hoje `eas.json` não define `EXPO_PUBLIC_API_URL` para `production`; sem configurar uma variável de produção, o app pode usar o endereço local padrão e não alcançar a API publicada.**

## Gerar APK de teste com EAS

O perfil `preview` de cada app gera um APK para distribuição interna. Execute cada comando dentro da pasta correspondente, com as credenciais EAS, `GOOGLE_MAPS_API_KEY` no ambiente `preview`, a API e o túnel ativos:

```powershell
cd appUser
npx eas-cli@latest build --platform android --profile preview
```

```powershell
cd appMotorista
npx eas-cli@latest build --platform android --profile preview
```

Os dois projetos têm `projectId` EAS próprio. O `.easignore` na raiz controla os arquivos enviados ao EAS; mantenha os comandos dentro da pasta do aplicativo desejado.

## Testes e integração contínua

A suíte da API usa SQLite em memória na configuração de testes. Para executá-la:

```powershell
cd api
php artisan test
```

A coleção Postman fica em `postman/InteriorGo.postman_collection.json`. Importe-a no Postman para testar cadastro/login e operações de corrida; a coleção salva tokens e o identificador da corrida durante o fluxo.

O workflow `.github/workflows/ci.yml` executa os testes Laravel com PHP 8.2 e gera um bundle Android Expo para `appUser` e `appMotorista` em pushes às branches `main`/`master` e em pull requests. Ele não publica APKs nem envia o app às lojas.

## Fluxo manual de teste

1. Inicie MySQL/MariaDB e a API; confira `http://localhost:8000/up`.
2. Inicie `appUser` e `appMotorista` apontando para a mesma API.
3. Cadastre um passageiro e um motorista. Em ambiente `local`, o motorista é aprovado automaticamente.
4. No app do motorista, fique online e deixe a tela inicial aberta.
5. No app do passageiro, selecione embarque, destino e categoria; confirme a corrida. Também é possível agendar para um horário futuro.
6. No app do motorista, abra as solicitações, aceite uma corrida, marque a chegada, inicie e finalize-a.
7. No app do passageiro, confirme o pagamento simulado e avalie o motorista; o motorista também pode avaliar o passageiro.

Mantenha notificações e localização permitidas para testar os avisos locais e acompanhamento. As notificações de corrida são locais; não há serviço remoto de push.

## Recursos e limitações atuais

- O app oferece opção **Manter conectado neste dispositivo**. Quando ativada, token e dados de sessão são guardados no AsyncStorage e a API valida a conta ao reabrir. Sem ela, o login permanece apenas até o app ser fechado.
- Consultas da API são armazenadas por conta para apresentação quando não há conexão. Dados em cache podem estar desatualizados. O logout limpa esses dados.
- Passageiros e motoristas podem editar perfil, endereço e senha (confirmando a senha atual), desativar a própria conta e enviar foto por câmera ou galeria. Fotos ficam em `api/storage/app/public/profile-photos`; `php artisan storage:link` publica o acesso.
- Cadastros consultam o ViaCEP para preencher endereço. Eventos e pontos de interesse dependem de registros ativos nas tabelas `tbEvento` e `tbPontoInteresse`.
- Favoritos, histórico e desempenho são carregados da API; não são exibidos saldos, promoções ou cadastros fictícios.
- Campos formatam CPF, telefone e CEP na tela; os valores enviados à API não contêm pontuação. A interface acompanha o modo claro/escuro. O agendamento usa seletores nativos no app e data/hora no navegador, aceitando somente horários futuros.
- A busca de endereços do app do passageiro usa OpenStreetMap/Nominatim e requer internet; os resultados são atribuídos a OpenStreetMap. Na web, os mapas são apenas informativos.
- O painel administrativo está em `/admin/login`. Administradores Master e Operadores consultam o dashboard e gerenciam eventos. Apenas Masters gerenciam contas e status de motoristas. O cadastro de Operador está no painel; o primeiro Master é criado pelo comando `php artisan admin:create-master`.
- Ainda não há gerenciamento administrativo de pontos sugeridos, saldo/crédito de carteira, saque ou recuperação de senha. Pagamentos são simulados: a API registra forma/status escolhidos, sem cobrar dinheiro e sem gateway.

## Antes de uma implantação real

Este repositório não contém configuração de hospedagem de produção, banco gerenciado, domínio, monitoramento, pipeline de publicação às lojas ou procedimento de suporte/operação. Antes de disponibilizar o serviço, escolha e configure esses componentes, use HTTPS, defina as variáveis de produção, restrinja chaves, revise permissões e privacidade e faça testes em ambiente de homologação. Verifique também as exigências legais e municipais aplicáveis ao serviço de transporte e à operação local. Não use ngrok nem `APP_DEBUG=true` em produção.

O README original registrava alertas de alta severidade nas dependências Expo/Metro/React Native identificados por `npm audit --omit=dev` naquele momento. Como esse diagnóstico depende das versões e pode mudar, repita a auditoria antes de cada release; não aplique correções forçadas sem revisar os impactos de compatibilidade.
