# 🌴 Selva Matemágica

Jogo de matemática infantil (adição, subtração, multiplicação/tabuada e divisão),
100% front-end (HTML + CSS + JavaScript puro), sem back-end. Progresso salvo no
`localStorage` do navegador.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub e suba **todos** os arquivos desta pasta
   (mantendo a estrutura `index.html`, `css/`, `js/`) para a branch `main`.
2. No GitHub, vá em **Settings → Pages**.
3. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
4. Salve. Em alguns minutos o site estará disponível em
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Não é necessário nenhum passo de build — é tudo estático.

## Testar localmente

Basta abrir `index.html` no navegador. Se preferir um servidor local (recomendado
para evitar bloqueios de alguns navegadores com `file://`):

```bash
# Python 3
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## O que editar e onde

| O que você quer mudar                          | Arquivo                  |
|-------------------------------------------------|---------------------------|
| Cores do app                                     | `css/style.css` → bloco `:root` no topo |
| Faixas numéricas — modo múltipla escolha         | `js/questions.js` → objeto `RANGES` |
| Faixas numéricas — modo "Armar Conta"            | `js/questions.js` → objeto `COLUMN_RANGES` |
| Quantidade de perguntas por rodada               | `js/game.js` → `QUESTIONS_PER_ROUND` |
| Regras de pontuação (moedas, bônus, estrelas)    | `js/storage.js` → objeto `SCORING` |
| Senha da Área dos Pais                           | `js/dashboard.js` → `PARENT_PASSWORD` |
| Frases do mascote                                | `js/game.js` → objeto `MASCOT_LINES` |
| Ícones/nomes dos módulos no menu                 | `index.html` → seção `.menu-grid` |

## Estrutura de pastas

```
matematica-divertida/
├── index.html          # todas as "telas" do app (menu, jogo, resultado, painel dos pais)
├── css/
│   └── style.css        # todo o visual (tema "selva", responsivo, animações)
├── js/
│   ├── storage.js        # leitura/escrita no localStorage + estatísticas
│   ├── questions.js       # geração aleatória das perguntas
│   ├── game.js            # mecânica da rodada, feedback, confete
│   ├── dashboard.js       # painel dos pais (senha + métricas)
│   └── app.js              # navegação entre telas e eventos de clique
└── README.md
```

## Observações importantes

- A senha da "Área dos Pais" (padrão: `1234`) é só uma trava simples contra
  cliques acidentais da criança — **não** é um mecanismo de segurança real,
  já que o código roda inteiramente no navegador do usuário.
- Os dados ficam salvos **no dispositivo/navegador** em que a criança jogou.
  Trocar de navegador, usar aba anônima ou limpar dados do site apaga o progresso.
- Para resetar o progresso de dentro do app, use o botão "Zerar Histórico"
  no Painel de Desempenho.
