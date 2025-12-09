const Gift = require("../models/Gift");

exports.salvarGift = async (chatId, text) => {
  try {
    // Quebra os dados por vírgula e remove espaços
    const campos = text.split(",").map(c => c.trim());

    // Confere se todos os 10 campos estão presentes
    if (campos.length < 10) {
      return { mensagem: "⚠️ Informe todos os campos separados por vírgula.", continuar: true };
    }

    const [cartao, validade, codigoSeguranca, bandeira, nivel, banco, pais, nome, cpf, valorStr] = campos;

    // Valida e converte valor
    const valor = parseFloat(valorStr.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      return { mensagem: "⚠️ Valor inválido. Digite um número válido maior que 0.", continuar: true };
    }

    // Log o nível recebido e o nível convertido
    console.log("Nível recebido:", nivel);
    const nivelUpper = nivel.toUpperCase();  // Convertendo para maiúsculas
    console.log("Nível após conversão para maiúsculas:", nivelUpper);

    // Valida o nível (converte para maiúsculas antes de validar)
    const niveisValidos = ["GOLD", "BLACK", "CLASSIC", "BUSINESS", "PLATINUM", "STANDARD", "ELO", "NUBANKBLACK"];
    if (!niveisValidos.includes(nivelUpper)) {
      console.log("⚠️ Nível inválido:", nivelUpper);
      return { mensagem: "⚠️ Nível inválido. Escolha um nível válido.", continuar: true };
    }

    // Verifica se o cartão já foi cadastrado
    const giftExistente = await Gift.findOne({ cartao });
    if (giftExistente) {
      return { mensagem: "⚠️ Este cartão já foi cadastrado.", continuar: true };
    }

    // Salva o gift no banco
    const novoGift = await Gift.create({
      userId: chatId,
      cartao,
      validade,
      codigoSeguranca,
      bandeira,
      nivel: nivelUpper,  // Salva o nível em maiúsculas
      banco,
      pais,
      nome,
      cpf,
      valor
    });

    return { mensagem: "🎉 Gift cadastrado com sucesso!", continuar: false };

  } catch (err) {
    console.error("Erro ao salvar gift:", err);
    return { mensagem: "❌ Erro ao salvar gift. Tente novamente mais tarde.", continuar: false };
  }
};
