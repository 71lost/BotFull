const Gift = require("../models/Gift");

// Função para salvar os gifts no banco
exports.salvarMix = async (chatId, text, quantidadeEsperada, userState) => {
  try {
    const linhas = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    // Verifica se o número de gifts enviados é igual ao esperado (3, 5, 10)
    if (linhas.length !== quantidadeEsperada) {
      return {
        mensagem: `⚠️ Você deve enviar exatamente *${quantidadeEsperada} gifts*, um por linha.`,
        continuar: true
      };
    }

    let giftsSalvos = 0;

    // Processa cada linha (gift)
    for (const linha of linhas) {
      const campos = linha.split("|").map(c => c.trim());  // Usando | como separador

      // Valida se a linha tem 4 campos (cartão, validade, código, e valor)
      if (campos.length < 4) {
        return { mensagem: "⚠️ Cada gift deve ter 4 campos separados por '|'.", continuar: true };
      }

      const [cartao, validade, codigoSeguranca, valorStr] = campos;

      // Validação do valor (é um número maior que 0)
      const valor = parseFloat(valorStr.replace(",", "."));
      if (isNaN(valor) || valor <= 0) {
        return { mensagem: `⚠️ Valor inválido no gift: ${cartao}`, continuar: true };
      }

      // Verifica se o cartão já foi cadastrado
      const jaExiste = await Gift.findOne({ cartao });
      if (jaExiste) {
        return { mensagem: `⚠️ O cartão ${cartao} já foi cadastrado.`, continuar: true };
      }

      // Cria o novo gift no banco de dados
      await Gift.create({
        userId: chatId,
        cartao,
        validade,
        codigoSeguranca,
        valor
      });

      giftsSalvos++; // Incrementa o contador de gifts salvos
    }

    // Retorna a mensagem de sucesso
    return { mensagem: `🎉 *${giftsSalvos} gifts cadastrados com sucesso!*`, continuar: false };

  } catch (err) {
    console.error("Erro ao salvar MIX:", err);
    return { mensagem: "❌ Erro ao salvar MIX.", continuar: false };
  }
};

// Função que trata o comando /mix e processa as mensagens dos usuários
const handleMessage = async (chatId, text) => {
  if (text === "/mix") {
    // Avisa o usuário que ele deve enviar os gifts
    await sendMessage(chatId, "📦 Envie *3 gifts*, um por linha.");
    userState[chatId] = { modo: "MIX", quantidade: 3 };  // Define o estado do usuário
    return;
  }

  // Verifica se o usuário está no fluxo de MIX
  if (userState[chatId]?.modo === "MIX") {
    const { quantidade } = userState[chatId];
    const resp = await salvarMix(chatId, text, quantidade, userState);

    // Envia a resposta para o usuário
    await sendMessage(chatId, resp.mensagem);

    // Se o fluxo foi finalizado, limpa o estado do usuário
    if (!resp.continuar) delete userState[chatId];

    return;
  }
};
