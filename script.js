const apiKeyInput = document.getElementById("apiKey");
const gameSelect = document.getElementById("gameSelect");
const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const aiResponse = document.getElementById("aiResponse");
const form = document.getElementById("form");

// Instruções para obter a API Key
const instructionsContainer = document.createElement("div");
instructionsContainer.innerHTML = `
  <p style="font-size: 0.9rem; margin-top: 6px;">
    🔐 <strong>Não tem uma API Key?</strong> 
    <a href="https://aistudio.google.com/app/apikey" target="_blank">Clique aqui para gerar a sua</a> usando uma Conta Google.
  </p>
`;
apiKeyInput.insertAdjacentElement("afterend", instructionsContainer);

// Conversor Markdown -> HTML
const markDownToHTML = (text) => {
    const converter = new showdown.Converter();
    return converter.makeHtml(text);
};

// Prompts personalizados por jogo
const promptsPorJogo = {
    tibia: (question) => `
## Especialidade
Você é um especialista em estratégias e builds para o jogo Tibia.

## Tarefa
Responda perguntas sobre vocações, hunts, equipamentos, magias e economia.

## Regras
- Se não souber, diga "Não sei".
- Se não for sobre Tibia, diga: "Essa pergunta não está relacionada ao jogo."
- Data atual: ${new Date().toLocaleDateString()}
- Use apenas informações confirmadas no patch atual.

## Resposta
- Máx 500 caracteres.
- Em Markdown.
- Sem saudações.

---

Pergunta: ${question}
`,

    pxg: (question) => `
## Especialidade
Você é um especialista no jogo Pokémon PXG (Pokémon Xtreme Global).

## Tarefa
Responda sobre pokémons por level, por tipo de clã, held items, movesets, spawns e builds.
Melhores hunts de acordo com super efetividade do clã do jogador.

## Regras
- Se não souber, diga "Não sei".
- Se não for sobre PXG, diga: "Essa pergunta não está relacionada ao jogo."
- Data atual: ${new Date().toLocaleDateString()}
- Use dados atuais do servidor.

## Resposta
- Máx 500 caracteres.
- Em Markdown.
- Sem saudações.

---

Pergunta: ${question}
`,

    btd6: (question) => `
## Especialidade
Você é um especialista em Bloons TD 6.

## Tarefa
Responda sobre torres, combinações, heróis, estratégias, mapas e modos.

## Regras
- Se não souber, diga "Não sei".
- Se não for sobre BTD6, diga: "Essa pergunta não está relacionada ao jogo."
- Data atual: ${new Date().toLocaleDateString()}
- Use dados do patch atual.

## Resposta
- Máx 500 caracteres.
- Em Markdown.
- Sem saudações.

---

Pergunta: ${question}
`
};

// Função que chama a API Gemini
const perguntarIA = async (question, game, apiKey) => {
    const model = "gemini-2.5-flash";
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const promptFunc = promptsPorJogo[game];
    if (!promptFunc) throw new Error("Jogo não suportado.");

    const pergunta = promptFunc(question);
    console.log("Prompt enviado para a API:", pergunta);

    const contents = [{
        role: "user",
        parts: [{ text: pergunta }]
    }];

    const tools = [{ google_search: {} }];

    const response = await fetch(geminiURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, tools })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro: resposta não recebida.";
};

// Envio do formulário
const enviarFormulario = async (event) => {
    event.preventDefault();

    const apiKey = apiKeyInput.value.trim();
    const game = gameSelect.value.toLowerCase().trim();
    const question = questionInput.value.trim();

    if (!apiKey || !game || !question) {
        alert("Preencha todos os campos!");
        return;
    }

    askButton.disabled = true;
    askButton.textContent = "Perguntando...";
    askButton.classList.add("loading");

    try {
        const text = await perguntarIA(question, game, apiKey);
        aiResponse.querySelector(".response-content").innerHTML = markDownToHTML(text);
        aiResponse.classList.remove("hidden");
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao buscar resposta. Verifique sua chave e tente novamente.");
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Perguntar";
        askButton.classList.remove("loading");
    }
};

form.addEventListener("submit", enviarFormulario);
