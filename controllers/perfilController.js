const axios = require("axios");
const User = require("../models/User");
const { calcularSaldo } = require("../services/saldoService");

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

exports.showProfileWithImage = async (chatId, messageId, nome) => {
    try {
        // ⚡ Busca usuário
        const user = await User.findOne({ telegramId: chatId });
        if (!user) throw new Error("Usuário não encontrado");

        // ⚡ Calcula saldo com ObjectId do usuário
        const saldo = await calcularSaldo(chatId);

        const captionText = `👤 *Perfil da Família Ace*\n\n🆔 Código da Família: ${chatId}\n💰 Saldo: ${saldo}\n\n💼 Status: *Membro Ativo*\n\nBem-vindo, *Rlk ${nome}*. Você agora faz parte da **Família Ace**, um círculo fechado onde apenas os melhores têm acesso.\n\n⚠️ Lembre-se: suas ações são observadas, e a lealdade é tudo.\n\n🔗 Seus recursos estão disponíveis para movimentação dentro da rede da família.`;

        const inlineKeyboard = [
            [{ text: "📄 Ver historico", callback_data: "historico" }],
            [{ text: "⬅️ Voltar", callback_data: "menu" }]
        ];

        const photoUrl = "https://tse4.mm.bing.net/th/id/OIP.Rl3SsdYTyVIh7YdhxCfpfQHaEK?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3";

        if (messageId) {
            // Edita mensagem existente
            await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
                chat_id: chatId,
                message_id: messageId,
                media: { type: "photo", media: photoUrl, caption: captionText, parse_mode: "Markdown" }
            });

            await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: inlineKeyboard }
            });
        } else {
            // Envia nova mensagem
            await axios.post(`${TELEGRAM_API}/sendPhoto`, {
                chat_id: chatId,
                photo: photoUrl,
                caption: captionText,
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: inlineKeyboard }
            });
        }
    } catch (error) {
        console.error("Erro ao mostrar perfil com imagem:", error.response?.data || error.message);
        throw new Error("Erro ao tentar mostrar perfil com imagem");
    }
};
