<div align="center">

# Clube do Livro Princesas de Jesus

**Um clube do livro para meninas ler, orar e crescer juntas.**

[Acessar o site](https://clube-livro.web.app) &nbsp;·&nbsp; [Entrar no app](https://clube-livro.web.app/app.html)

![HTML](https://img.shields.io/badge/HTML5-1a1a1a?style=flat-square&logo=html5&logoColor=e34f26)
![CSS](https://img.shields.io/badge/CSS3-1a1a1a?style=flat-square&logo=css3&logoColor=1572b6)
![JavaScript](https://img.shields.io/badge/JavaScript-1a1a1a?style=flat-square&logo=javascript&logoColor=f7df1e)
![Firebase](https://img.shields.io/badge/Firebase-1a1a1a?style=flat-square&logo=firebase&logoColor=ffca28)

</div>

---

## Sobre

O projeto reúne duas partes: uma página de apresentação, com um livro animado que se abre conforme a rolagem, e um aplicativo onde cada participante acompanha a própria leitura ao lado do clube.

Ao cadastrar um livro, o cronograma de leitura é gerado automaticamente a partir do número de páginas e das datas de início e fim.

## Como funciona

1. **Leia as páginas do dia.** O cronograma é calculado sozinho.
2. **Responda três perguntas:** o que me marcou, o que aprendi e pelo que quero orar.
3. **Marque o dia como concluído** e acompanhe o clube avançando junto com você.

## Recursos

- Cadastro de livros com capa, autor, total de páginas e período de leitura
- Cronograma diário gerado automaticamente, com opção de impressão
- Progresso de cada participante visível para todo o clube
- Anotações pessoais e privadas, que nem a administração consegue ler
- Perfil com nome, ícone e cor personalizáveis
- Painel de administração para remover e restaurar o acesso de participantes
- Recuperação de senha por e-mail

## Tecnologias

| Camada          | Uso                                              |
| --------------- | ------------------------------------------------ |
| Front-end       | HTML, CSS e JavaScript puro, sem etapa de build  |
| Autenticação    | Firebase Authentication                          |
| Banco de dados  | Cloud Firestore                                  |
| Hospedagem      | Firebase Hosting                                 |

## Estrutura

```
.
├── index.html          Página de apresentação
├── landing.css         Estilos da página de apresentação
├── landing.js          Animação do livro e interações da página
├── app.html            Shell do aplicativo
├── app.js              Lógica do aplicativo (telas, cronograma, progresso)
├── art.js              Ilustrações em SVG usadas nas páginas
├── firebase-config.js  Configuração do app web do Firebase
├── firestore.rules     Regras de segurança do banco
├── firebase.json       Configuração de hospedagem e regras
└── img/                Imagens do projeto
```

## Segurança dos dados

As regras em [`firestore.rules`](firestore.rules) definem quem pode ler e escrever em cada coleção:

| Coleção     | Leitura                    | Escrita                                   |
| ----------- | -------------------------- | ----------------------------------------- |
| `users`     | Quem está logado           | Cada pessoa edita o próprio perfil        |
| `books`     | Quem está logado           | Quem cadastrou o livro; admin pode excluir |
| `progress`  | Quem está logado           | Apenas a dona do progresso                |
| `notes`     | Apenas a dona              | Apenas a dona; admin só pode apagar       |
| `admins`    | Quem está logado           | Ninguém pelo app                          |

A chave presente em `firebase-config.js` identifica o app web e não é um segredo. O acesso aos dados é controlado pelas regras acima.

## Executar localmente

Não há dependências para instalar. Sirva a pasta com qualquer servidor estático, por exemplo:

```bash
npx serve .
```

Depois abra o endereço indicado no navegador.

---

Acesse o clube em **[clube-livro.web.app](https://clube-livro.web.app)**
