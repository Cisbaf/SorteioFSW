# Sorteio CISBAF na #fswk26 — Front-end

Página de inscrição no sorteio (pensada para celular) e painel do admin para listar, excluir e sortear participantes.
Next.js 16 + Tailwind 4. Conversa com o backend Spring em `../SorteioFswBackEnd`.

## Rodando

```bash
cp .env.example .env.local   # ajuste BACKEND_URL se o Spring não estiver em http://localhost:8080
npm install
npm run dev                  # http://localhost:3000  ·  admin em /admin
```

Para testar no celular na mesma rede, abra `http://<ip-do-computador>:3000`.

Produção: `npm run build && npm start`.

## Rotas

| Rota           | Quem acessa | O que faz                                                    |
| -------------- | ----------- | ------------------------------------------------------------ |
| `/`            | público     | Formulário de inscrição                                      |
| `/admin/login` | admin       | Login com o usuário/senha do `.env` do backend               |
| `/admin`       | admin       | Lista, busca, exclui e sorteia participantes                 |

Os textos do evento (datas, cidade, links) ficam em `src/lib/evento.ts`.

## Segurança

- **O navegador nunca fala com o Spring.** Inscrição, login e exclusão são Server Actions: o servidor do Next chama o
  backend em `BACKEND_URL`. Em produção o backend pode (e deve) ficar acessível só pela rede interna.
- **Sessão do admin** em cookie `HttpOnly`, `SameSite=Strict` e `Secure` (em produção). O token JWT nunca chega ao
  JavaScript da página. Toda action do admin confere a sessão de novo; o backend valida o token em toda chamada.
- **CSRF**: Server Actions só aceitam requisições cuja `Origin` bate com o host do site.
- **Content-Security-Policy com nonce** por requisição (`src/proxy.ts`): só os scripts do próprio Next executam, nada
  é carregado de outro domínio e a página não pode ser embutida em iframe. Demais cabeçalhos em `next.config.ts`
  (HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- **Validação** com Zod no navegador e de novo no servidor, com os mesmos limites das colunas do banco.
- **Anti-abuso**: campo-armadilha para robôs e limite por IP (30 inscrições/10 min, generoso porque no evento muita
  gente divide o mesmo IP; 10 tentativas de login/15 min).
- Erros do backend nunca são repassados ao usuário; o detalhe fica só no log do servidor.

## Deploy

- Sirva **só por HTTPS**, atrás de um proxy reverso (nginx, Caddy...) que **sobrescreva** `X-Forwarded-For` e repasse
  `X-Forwarded-Host`. O limite por IP depende desse cabeçalho.
- O limite por IP fica em memória: vale por instância. Com mais de uma instância, defina também
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` igual em todas.
- `COOKIE_SECURE=false` só para testar `npm start` sem HTTPS em outra máquina.
