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
php artisan serve --host=0.0.0.0 --port=8000
```

`APP_ENV=local` habilita aprovação automática de motoristas cadastrados para
facilitar testes locais. Fora dos ambientes `local` e `testing`, novos
motoristas ficam pendentes de aprovação.

## Apps Expo

Em dois terminais separados:

```powershell
cd appUser
npm install
npm start
```

```powershell
cd appMotorista
npm install
npm start
```

Leia o QR code com o Expo Go. Os apps usam `http://10.0.2.2:8000` no emulador
Android e `http://localhost:8000` por padrão nos demais alvos. Em um aparelho
físico, configure o IP acessível do computador antes de iniciar o Expo:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.0.10:8000"
npm start
```

O app acrescenta `/api` a esse endereço. O aparelho e o computador precisam
estar na mesma rede; permita conexões locais na firewall. Autorize localização
e notificações quando solicitadas. Mapas e localização usam módulos compatíveis
com Expo Go; na web os mapas são apenas informativos.

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

Eventos, promoções, favoritos, carteira, saque, aprovação administrativa,
recuperação de senha e integrações de pagamento/push ainda são telas ou dados
de demonstração; não fazem parte do fluxo persistido testável desta entrega.

Antes de qualquer publicação, atualize e revise as dependências:
`npm audit --omit=dev` reporta avisos de alta severidade nas árvores
Expo/Metro/React Native dos dois apps. O conserto automático forçado propõe uma
redução incompatível do Expo; por isso não foi aplicado junto com esta
preparação para testes.
