const axios = require("axios");
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

exports.sendMenu = async (chatId) => {
    try {
        const response = await axios.post(`${TELEGRAM_API}/sendPhoto`, {
            chat_id: chatId,
            photo: "https://tse2.mm.bing.net/th/id/OIP.Bdq7bcf83L5OPPbVrW6OLgHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3", // URL do banner
            caption: "🏪 *Bem-vindo à RARIDADE STORE*\n\nO lugar onde apenas os melhores encontram *o que realmente importa*.\n\nAqui, não oferecemos apenas *material* — oferecemos **qualidade inquestionável**, feita para quem sabe o que quer.\n\n**🔒** Testado, aprovado, e entregue apenas aos que **entendem** do assunto.\n\n**🔄** Troca? Apenas *10 minutos* para quem sabe aproveitar o tempo da forma certa. Não somos para todos — somos para os melhores.",
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🛒 COMPRAR", callback_data: "comprar" },
                        { text: "👤 PERFIL", callback_data: "perfil" }
                    ],
                    [
                        { text: "💰 DEPOSITO", callback_data: "deposito" }
                    ]
                ]
            }
        });
        return response;
    } catch (error) {
        console.error("Erro ao enviar menu:", error);
        throw error;
    }
};

exports.editMenu = async (chatId, messageId) => {
    try {
        const response = await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
            chat_id: chatId,
            message_id: messageId,
            media: {
                type: "photo",
                media: "https://tse2.mm.bing.net/th/id/OIP.Bdq7bcf83L5OPPbVrW6OLgHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3", // nova URL da imagem
                caption: "🏪 *De volta a Lojinha RARIDADE STORE*\n\nO lugar onde apenas os melhores encontram *o que realmente importa*.\n\nAqui, não oferecemos apenas *material* — oferecemos **qualidade inquestionável**, feita para quem sabe o que quer.\n\n**🔒** Testado, aprovado, e entregue apenas aos que **entendem** do assunto.\n\n**🔄** Troca? Apenas *10 minutos* para quem sabe aproveitar o tempo da forma certa. Não somos para todos — somos para os melhores.",
                parse_mode: "Markdown"
            },
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🛒 COMPRAR", callback_data: "comprar" },
                        { text: "👤 PERFIL", callback_data: "perfil" }
                    ],
                    [
                        { text: "💰 DEPOSITO", callback_data: "deposito" }
                    ]
                ]
            }
        });
        return response;
    } catch (error) {
        console.error("Erro ao editar menu:", error);
        throw error;
    }
};
