const menu = require("./menuController");
const axios = require("axios");
const User = require("../models/User");
const depositoController = require("./depositarController");
const giftController = require("./giftController");
const Gift = require("../models/Gift");
const { listarPorBIN } = require("./comprarController");

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

exports.handleMessage = async (message) => {
    const chatId = message.chat.id;
    const text = message.text;

    console.log("Mensagem recebida:", text);

    try {
        // 🔹 Busca o usuário no banco
        let user = await User.findOne({ telegramId: chatId });

        if (!user) {
            user = await User.create({
                telegramId: chatId,
                username: message.chat.username || "Desconhecido",
                first_name: message.chat.first_name || "Sem nome",
                state: "new"
            });
            console.log("Novo usuário criado:", user);
        }

        // 🔹 Se não houver texto (stickers, imagens, etc)
        if (!text) {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: "⚠️ Tipo de mensagem não suportado."
            });
            return;
        }

        // =====================================================
        // 🔹 TRATAMENTO DE COMANDOS
        // =====================================================
        if (text.startsWith("/")) {
            // /pix {valor}
            if (text.startsWith("/pix")) {
                const parts = text.split(" ");
                const valor = parseFloat(parts[1]);

                if (!isNaN(valor) && valor > 0) {
                    await depositoController.handlePixGerar(chatId, valor, chatId);
                } else {
                    await axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: chatId,
                        text: "❌ Valor inválido. Use /pix 50"
                    });
                }
                return;
            }

            // /bin {codigo}
            if (text.startsWith("/bin")) {
            const parts = text.trim().split(" ");
            const binCode = parts[1];

            // Verifica se o usuário enviou o BIN
            if (!binCode) {
                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    text: "⚠️ Envie o BIN corretamente.\n\nExemplo: `/bin 550671`",
                    parse_mode: "Markdown"
                });
                return;
            }

            // Verifica se tem exatamente 6 dígitos numéricos
            if (!/^\d{6}$/.test(binCode)) {
                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    text: "❌ O BIN deve conter **exatamente 6 números**.\nExemplo correto: `/bin 402934`",
                    parse_mode: "Markdown"
                });
                return;
            }

            console.log("Buscando BIN:", binCode);

            // Chama sua função
            await listarPorBIN(chatId, message.message_id, binCode, user);

            return;
        }

            // /addSaldo {valor}
            if (text.startsWith("/addSaldo")) {
                const parts = text.split(" ");
                const valor = parts[1]?.replace(",", ".");
                await depositoController.addSaldoTeste(chatId, valor, chatId);
                return;
            }

            // =====================================================
            // 🔹 COMANDO /START
            // =====================================================
            if (text === "/start") {
                try {
                    // Envia uma mensagem com uma foto de boas-vindas e um menu interativo
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
                    console.error("Erro ao enviar foto e menu:", error);
                    await axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: chatId,
                        text: "❌ Ocorreu um erro ao tentar enviar o menu. Tente novamente mais tarde."
                    });
                }
            }
        }

        // =====================================================
        // 🔹 FLUXO DE GIFT
        // =====================================================
        console.log("Verificando fluxo de gift...");

        // Verifica se o usuário está no fluxo de gift
        const giftAtivo = await Gift.findOne({ userId: chatId, estado: { $lt: 12 } });
        console.log("giftAtivo:", giftAtivo);

        if (giftAtivo && giftAtivo.estado < 12) {
            console.log("Fluxo de gift ativo ou /giftdata detectado.");
            const resultado = await giftController.salvarGift(chatId, text);
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: resultado.mensagem
            });
            return;
        }

        // 🔹 Campos de gift somente quando NÃO for comando
        console.log("Verificando se é um gift válido...");
        if (
            !text.startsWith("/") &&
            text.includes(",") &&
            text.split(",").length >= 10
        ) {
            console.log("Formato de gift válido detectado.");
            const resultado = await giftController.salvarGift(chatId, text);
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: resultado.mensagem
            });
            return;
        }

        // 🔹 Mensagem inválida (não comando e não gift válido)
        console.log("Mensagem não válida para gift. Enviando erro...");
        if (!text.startsWith("/") && (!text.includes(",") || text.split(",").length < 10)) {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: "⚠️ Informe todos os campos separados por vírgula (mínimo 10 campos)."
            });
            return;
        }

        // =====================================================
        // 🔹 RESPOSTA PADRÃO
        // =====================================================
        console.log("Nenhum comando ou gift válido. Enviando resposta padrão...");
        const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: `Você disse: ${text}`
        });

        // Ajuste para salvar o último message_id corretamente
        if (response?.data?.result?.message_id) {
            user.lastMessageId = response.data.result.message_id;
            await user.save();
        }

        return response;

    } catch (error) {
        console.error("Erro ao processar a mensagem:", error);

        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "❌ Erro interno. Tente novamente mais tarde."
        });
    }
};
