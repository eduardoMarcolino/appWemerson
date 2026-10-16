# InteriorGo

Protótipo de aplicativo de transporte local composto por uma API Laravel e dois
apps Expo: passageiro e motorista. O escopo funcional para testes cobre cadastro,
login, solicitação/agendamento, aceite, acompanhamento, conclusão, pagamento
simulado e avaliações.

## API local

Requisitos: PHP 8.2+, Composer e MySQL/MariaDB. O arquivo
`api/database/migrations` é a fonte do esquema usado pela API.

```powershell
cd api
Copy-Item .env.example .env
composer install
php artisan key:generate
```

Configure `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` no `api/.env` para um
banco local vazio e então execute:

```powershell
php artisan migrate
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000
```

`APP_ENV=local` habilita aprovação automática de motoristas cadastrados para
facilitar testes locais. Fora dos ambientes `local` e `testing`, novos
motoristas ficam pendentes de aprovação.

## Apps Expo

Em dois terminais separados:

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

`npm ci` instala exatamente as versões do lockfile. Se aparecer conflito de
versão entre React e ReactDOM, execute `npm ci` dentro de `appUser` e reinicie
o Expo limpando o cache com `npx expo start --web --clear`.

Leia o QR code com o Expo Go. Os apps usam `http://10.0.2.2:8000` no emulador
Android e `http://localhost:8000` por padrão nos demais alvos. Em um aparelho
físico na mesma rede Wi-Fi, abra outro terminal na raiz do repositório e inicie
a API escutando na rede local:

```powershell
cd api
php artisan serve --host=0.0.0.0 --port=8000
```

Permita o PHP/porta 8000 no firewall do Windows e configure `EXPO_PUBLIC_API_URL`
com o IPv4 do computador. Para desenvolvimento local, defina a variável antes
de iniciar o app:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.0.14:8000"
cd appUser # ou appMotorista
npm start
```

O app acrescenta `/api` a esse endereço. O aparelho e o computador precisam
estar na mesma rede. Para o APK de teste EAS, o perfil `preview` dos dois apps
usa o endereço HTTPS do túnel ngrok descrito abaixo. Builds `production` devem
usar uma API publicada com HTTPS. Autorize localização
e notificações quando solicitadas. Mapas e localização usam módulos compatíveis
com Expo Go; na web os mapas são apenas informativos.

## Expor a API local pelo ngrok

O projeto inclui um túnel ngrok de desenvolvimento para a API Laravel. O
servidor Laravel continua rodando localmente na porta 8000; o túnel só publica
essa porta e não substitui o servidor. Inicie a API no primeiro terminal:

```powershell
cd api
php artisan serve --host=0.0.0.0 --port=8000
```

No segundo terminal, configure o authtoken do ngrok como variável de ambiente
da sessão (copie-o do painel do ngrok, mas não o salve no código ou em arquivos
versionados) e inicie o túnel:

```powershell
cd api
npm ci
$env:NGROK_AUTHTOKEN = Read-Host -Prompt "Authtoken ngrok"
$env:NGROK_ADDR = "localhost:8000"
$env:NGROK_DOMAIN = "reviver-resurrect-silver.ngrok-free.dev"
npm run dev:ngrok
```

O domínio precisa estar reservado na conta do ngrok associada ao authtoken.
Mantenha os dois terminais abertos. O túnel mostra a URL pública da API; teste
`https://reviver-resurrect-silver.ngrok-free.dev/up`. Se a API local estiver
em outra porta, ajuste `NGROK_ADDR` (por exemplo, `localhost:8085`) e inicie o
Laravel nessa mesma porta.

Para executar o app no Expo Go apontando para o túnel, defina a URL antes de
iniciar o Expo:

```powershell
$env:EXPO_PUBLIC_API_URL = "https://reviver-resurrect-silver.ngrok-free.dev"
cd appUser # ou appMotorista
npm start
```

Os perfis `preview` de ambos os APKs também usam esse domínio HTTPS. Gere o APK
com o túnel e a API ainda ativos, e mantenha-os ativos para testar no celular.
As requisições dos apps ignoram a página intermediária de aviso do plano
gratuito do ngrok.

O login tem a opção **Manter conectado neste dispositivo**. Quando marcada, o
token e os dados da sessão são salvos no AsyncStorage; ao abrir o app, a API
valida novamente a conta. Se ela tiver sido removida ou desativada, o app
encerra a sessão; se a API estiver sem conexão, usa a sessão e o cache salvos,
informando que podem estar desatualizados. Sem essa opção, o login só permanece
até o app ser fechado. O logout remove também os dados em cache. Consultas da
API são armazenadas por conta para exibição quando não há conexão.

Passageiros e motoristas podem editar os dados pessoais e endereço na tela
**Perfil/Conta**, alterar a senha mediante confirmação da senha atual e
desativar a própria conta. Passageiros e motoristas podem tirar uma foto com a
câmera ou escolher uma imagem da galeria; ela é enviada à API e armazenada em
`storage/app/public/profile-photos`. Execute `php artisan storage:link` para
que o Laravel sirva as imagens em `/storage`. Os cadastros consultam o ViaCEP
para preencher logradouro, bairro, cidade e UF; ao criar uma corrida, o CEP
também preenche o endereço, e o mapa é usado para marcar as coordenadas do
embarque/destino.

Eventos e locais sugeridos vêm das tabelas `tbEvento` e `tbPontoInteresse`.
Favoritos de endereço e motorista, pagamentos e desempenho são carregados da
API; não são exibidos saldos, promoções ou cadastros fictícios. Eventos e locais
só aparecem quando existirem registros ativos no banco.

## APK de teste pelo EAS

Este repositório contém os dois apps em subpastas. A configuração de arquivos
enviados ao EAS fica no `.easignore` da raiz do repositório; execute os comandos
na pasta do app desejado para selecionar o projeto certo. O perfil `preview`
gera um APK instalável para testes:

```powershell
cd appUser
npx eas-cli@latest build --platform android --profile preview
```

```powershell
cd appMotorista
npx eas-cli@latest build --platform android --profile preview
```

Nos perfis `preview`, a URL já está definida como
`https://reviver-resurrect-silver.ngrok-free.dev` nos dois `eas.json`. Se trocar
o domínio reservado, atualize os dois arquivos. O EAS substitui as variáveis
`EXPO_PUBLIC_*` no bundle durante a compilação.

## Roteiro de teste ponta a ponta

1. Cadastre um passageiro no `appUser` e um motorista no `appMotorista`.
2. No app do motorista, fique online e deixe a tela inicial aberta.
3. No app do passageiro, selecione destino e embarque, categoria e confirme a
   corrida. Também é possível informar data/hora futura para criar um
   agendamento.
4. No app do motorista, abra as solicitações, aceite uma e marque a chegada.
   Inicie a corrida, permita localização e finalize no destino.
5. No app do passageiro, confirme o pagamento de teste e envie a avaliação.
   O motorista pode então avaliar o passageiro.

As notificações são locais e de teste: não há serviço de push remoto. O
pagamento registra a forma escolhida e altera o estado na API, mas **não cobra
dinheiro nem integra um gateway**. Não use dados ou cartões reais.

## Testes e Postman

Na pasta `api`, rode `php artisan test`. A suíte usa SQLite em memória e cobre
autenticação, autorização, transições da corrida, localização, pagamento e
avaliações.

Importe `postman/InteriorGo.postman_collection.json` no Postman. A coleção
guarda os tokens e o identificador da corrida automaticamente. Cadastre os dois
perfis uma vez ou use os requests de login ao repetir o roteiro.

## Limites atuais

O painel administrativo da API fica em `/admin/login`. Administradores Master e
Operadores podem consultar o dashboard e cadastrar, editar, ativar ou desativar
eventos. Somente Masters podem consultar, editar ou desativar contas e alterar
o status dos motoristas. O link **Cadastre-se como Operador** cria uma conta de
Operador; para criar o primeiro Master no banco configurado, execute
`php artisan admin:create-master` dentro da pasta `api`.

Ainda não há gerenciamento de locais sugeridos, saldo/crédito de carteira,
saque, recuperação de senha ou integração de pagamento/push. O pagamento segue
simulado para testes.

Antes de qualquer publicação, atualize e revise as dependências:
`npm audit --omit=dev` reporta avisos de alta severidade nas árvores
Expo/Metro/React Native dos dois apps. O conserto automático forçado propõe uma
redução incompatível do Expo; por isso não foi aplicado junto com esta
preparação para testes.
