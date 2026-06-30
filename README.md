# 🏥 Almoxarifado – Laboratório de Enfermagem

> 🌐 **Deploy:** [https://davilaops.github.io/Sprint-1](https://davilaops.github.io/Sprint-1)

Sistema web de controle de estoque desenvolvido para o laboratório de enfermagem.  
Permite cadastrar, consultar, dar baixa e excluir materiais com integração ao MockAPI.

---

## 📁 Estrutura do Projeto

```
almoxarifado/
├── index.html                        → Estrutura HTML da página
├── style.css                         → Estilos e layout visual
├── main.js                           → Lógica de negócio e integração com a API
├── package.json                      → Configurações e scripts do projeto
├── __tests__/
│   └── validarRetirada.test.js       → Testes unitários da regra de negócio
└── README.md                         → Documentação (este arquivo)
```

---

## 🚀 Como Rodar Localmente

### Opção 1 – Abrir direto no navegador
Dê duplo clique no arquivo `index.html`.

### Opção 2 – Com live-server
```bash
npm install
npm start
```
Abre automaticamente em `http://localhost:3000`.

### Rodar os testes unitários
```bash
npm test
```

---

## ⚙️ Configuração da API

URL definida no topo de `main.js`:

```js
const API_URL = 'https://6a30a326a7f8866418d63d9c.mockapi.io/materiais';
```

---

## ✅ Contrato Técnico (IDs e Classes Obrigatórios)

| Seletor | Elemento | Sprint |
|---|---|---|
| `#input-nome` | Campo de nome no cadastro | 1 |
| `#input-quantidade` | Campo de quantidade no cadastro | 1 |
| `#btn-cadastrar` | Botão de cadastro (POST) | 1 |
| `#lista-materiais` | Tabela de listagem | 1 |
| `#input-retirada` | Campo de quantidade a retirar (primeira linha) | 2 |
| `.btn-baixar` | Botão de baixa de estoque (PUT) | 2 |
| `.btn-excluir` | Botão de exclusão (DELETE) | 2 |
| `#input-busca` | Campo de pesquisa de materiais | 3 |
| `#total-itens` | Contador de itens exibidos | 3 |
| `.estoque-critico` | Classe aplicada nas linhas com estoque < 10 | 3 |

---

## 📋 Funcionalidades por Sprint

### Sprint 1 — Fundação, API e Inventário
- **GET** → Lista todos os materiais ao carregar a página
- **POST** → Cadastra novo material via formulário
- Painel de estatísticas (total de itens, unidades, itens zerados)
- Layout responsivo para mobile e desktop

### Sprint 2 — Regras de Negócio e Saídas
- **PUT** → Retirada (baixa) de estoque por linha, via `.btn-baixar`
- **DELETE** → Exclusão com modal de confirmação, via `.btn-excluir`
- Função `validarRetirada(estoqueAtual, quantidadeRetirada)` bloqueia: negativos, zero e valores acima do estoque
- Testes unitários em `__tests__/validarRetirada.test.js` (10 casos, 100% passando)

### Sprint 3 — Finalização e Deploy
- **Barra de pesquisa** (`#input-busca`) com filtro em tempo real sem nova requisição à API
- **Contador `#total-itens`** atualiza conforme o filtro de busca
- **Alerta visual de estoque crítico**: linhas com `< 10` unidades recebem `class="estoque-critico"` (fundo laranja + badge "⚠ Crítico")
- **Card de estatísticas** exibe contador dedicado de itens em estoque crítico
- **Tratamento de erros de rede** em todos os `fetch`:
  - `TypeError` → banner vermelho fixo "Sem conexão" com botão "Tentar novamente"
  - Erros HTTP (4xx/5xx) → toast descritivo com o código do erro
- **Deploy** via GitHub Pages

---

## 🧪 Testes Unitários

A função `validarRetirada` possui 10 casos cobrindo:

| Caso | Esperado |
|---|---|
| Retirada parcial válida (5 de 10) | `true` |
| Retirada exata do total (10 de 10) | `true` |
| Retirada maior que estoque (10 de 5) | `false` |
| Retirada negativa | `false` |
| Retirada igual a zero | `false` |
| Retirar de estoque zerado | `false` |
| Valor não numérico na quantidade | `false` |
| Valor não numérico no estoque | `false` |
| String numérica válida `"5"` | `true` |
| Retirada total de estoque grande | `true` |

---

## 🌐 Deploy (GitHub Pages)

1. Acesse o repositório no GitHub
2. Vá em **Settings → Pages**
3. Em **Branch**, selecione `main` e pasta `/ (root)`
4. Clique em **Save**
5. Aguarde ~1 minuto e acesse: `https://davilaops.github.io/Sprint-1`

---

## 📝 Histórico de Commits

| Sprint | Mensagem de commit sugerida |
|---|---|
| Sprint 1 | `Sprint 1 - estrutura, GET e POST com MockAPI` |
| Sprint 2 | `Sprint 2 - retirada PUT, exclusao DELETE e validacao de estoque` |
| Sprint 3 | `Sprint 3 - busca, estoque critico, tratamento de erros e deploy` |