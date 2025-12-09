const axios = require("axios");
const User = require("../models/User");
const menuController = require("./menuController");
const comprarController = require("./comprarController");
const perfilController = require("./perfilController");
const depositoController = require("./depositarController");
const { enviarMix } = require("./comprarController");
const historicoGift = require("../services/historicoGift");


const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

exports.handleCallback = async (update) => {
  const cb = update.callback_query;
  const chatId = cb.message.chat.id;
  const data = cb.data;
  const messageId = cb.message.message_id;

  console.log("Botão clicado:", data);

  const user = await User.findOne({ telegramId: chatId });
  if (!user) {
    console.log("❌ Usuário não encontrado");
    return;
  }

  let response;
  if (data && data.startsWith("nivel_")) {
    const nivel = data.replace("nivel_", "");
    console.log("Listando gifts do nível:", nivel);

    try {
      const resp = await comprarController.listarPorNivel(chatId, messageId, nivel, user);

      if (resp?.result?.message_id) {
        user.lastMessageId = resp.result.message_id;
        await user.save();
      }
    } catch (err) {
      console.error("Erro ao listar gifts:", err.message);
    }
    return;
  }

  // Se o botão clicado for de MIX

  if (data === "MIX_3") {
      return enviarMix(chatId, messageId, 3);
  }

  if (data === "MIX_5") {
      return enviarMix(chatId, messageId, 5);
  }

  if (data === "MIX_10") {
      return enviarMix(chatId, messageId, 10);
  }



  switch (data) {
    case "deposito":
      response = await depositoController.showDepositoOptions(chatId, messageId, user.saldo);
      break;

    case "perfil":
      response = await perfilController.showProfileWithImage(chatId, messageId, user.first_name || user.username);
      break;

    case "menu":
      response = await menuController.editMenu(chatId, messageId);
      break;

    case "comprar":
      response = await comprarController.handleCompra(chatId, messageId);
      break;

    case "CC":
      response = await comprarController.comprarCC(chatId, messageId);
      break;

    case "BIN":
      response = await comprarController.mostrarBin(chatId, messageId);
      break;

    case "CC MIX":
      response = await comprarController.comprarMix(chatId, messageId);
      break;
    case "historico":
      response = await historicoGift.mostrarHistorico(chatId);
      break;
    case "voltar_menu_compras":
      response = await comprarController.handleCompra(chatId, messageId);
      break;
    default:
      console.log("Callback desconhecido:", data);
      return;
  }

  // ======================================================
  // 3️⃣ Atualiza o lastMessageId corretamente
  // ======================================================
  if (response?.data?.result?.message_id) {
    user.lastMessageId = response.data.result.message_id;
    await user.save();
    console.log("✔ lastMessageId atualizado:", user.lastMessageId);
  }
};

// Função para enviar mensagens ao Telegram
const sendMessage = async (chatId, message) => {
  try {
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: message
    });
    console.log('Mensagem enviada com sucesso:', response.data);
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
  }
};
