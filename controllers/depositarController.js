// controllers/depositoController.js
const axios = require("axios");
const { gerarPix } = require("../services/mpPix");
const User = require("../models/User");
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;
const Deposito = require("../models/Deposito");
const { calcularSaldo } = require("../services/saldoService");
const Transacao = require("../models/Transacao");

// Mostrar opções de depósito
exports.showDepositoOptions = async (chatId, messageId, saldo) => {
    try {
        const captionText =
            `💰 *Depósito*\n\n` +
            `Seu saldo atual é: *R$ ${saldo}*\n\n` +
            `Para realizar um depósito, utilize o comando:\n` +
            `*/pix {valor}*\n\n` +
            `Exemplo: /pix 50`;

        const inlineKeyboard = [
            [{ text: "⬅️ Voltar", callback_data: "menu" }]
        ];

        const photoUrl =
            "https://static.vecteezy.com/system/resources/previews/013/361/136/non_2x/life-insurance-3d-icon-suitable-to-be-used-as-an-additional-element-in-the-design-of-templates-insurance-posters-and-banners-finance-png.png";

        if (messageId) {
            try {
                // Tenta editar mídia
                await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
                    chat_id: chatId,
                    message_id: messageId,
                    media: {
                        type: "photo",
                        media: photoUrl,
                        caption: captionText,
                        parse_mode: "Markdown"
                    }
                });

                await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: { inline_keyboard: inlineKeyboard }
                });

                return;
            } catch (err) {
                console.log("editMessageMedia falhou:", err.response?.data || err.message);
            }
        }

        // Caso não consiga editar, envia uma nova mensagem
        return await axios.post(`${TELEGRAM_API}/sendPhoto`, {
            chat_id: chatId,
            photo: photoUrl,
            caption: captionText,
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: inlineKeyboard }
        });

    } catch (error) {
        console.error("Erro ao mostrar opções de depósito:", error.response?.data || error.message);
    }
};

exports.handlePixGerar = async (chatId, valor, telegramId, messageId = null) => {
    try {
        const valorFloat = parseFloat(valor);

        if (isNaN(valorFloat) || valorFloat <= 0) {
            return axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: "❌ Valor inválido. Use: /pix 50"
            });
        }

        // === GERAR PIX ===
        const pix = await gerarPix(valorFloat);

        if (!pix || !pix.id) {
            return axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: "❌ Erro ao gerar o PIX. Tente novamente."
            });
        }

        const texto =
            `💵 PIX gerado para *R$ ${valorFloat.toFixed(2)}*:\n\n` +
            `\`${pix.copiaCola}\`\n\n` +
            `Pague o PIX e o saldo será liberado automaticamente.`;

        const botoes = {
            inline_keyboard: [
                [{ text: "⬅️ Voltar", callback_data: "deposito" }]
            ]
        };

        // ============================================
        // 🔥 TENTAR EDITAR A MENSAGEM ORIGINAL
        // ============================================
        if (messageId) {
            try {
                await axios.post(`${TELEGRAM_API}/editMessageText`, {
                    chat_id: chatId,
                    message_id: messageId,
                    text: texto,
                    parse_mode: "Markdown",
                    reply_markup: botoes
                });

                console.log("Mensagem de PIX EDITADA com sucesso.");
            } catch (err) {
                console.log("Falha ao editar, enviando nova mensagem:", err.response?.data);

                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    text: texto,
                    parse_mode: "Markdown",
                    reply_markup: botoes
                });
            }
        } else {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: texto,
                parse_mode: "Markdown",
                reply_markup: botoes
            });
        }

        // ============================================
        // 🔥  SALVAR DEPÓSITO PENDENTE (ID REAL DO PAGAMENTO)
        // ============================================
        await Deposito.create({
            telegramId,
            valor: valorFloat,
            paymentId: pix.id,   // << ESTE ID AGORA ESTÁ CORRETO!
            status: "pendente",
            criadoEm: new Date()
        });

        console.log(`📌 Depósito pendente salvo! paymentId = ${pix.id}`);

    } catch (error) {
        console.error("Erro ao gerar PIX:", error.response?.data || error.message);
    }
};

exports.addSaldoTeste = async (telegramId, valor, chatId) => {
    try {
        const user = await User.findOne({ telegramId });
        if (!user) throw new Error("Usuário não encontrado");

        const valorFloat = parseFloat(valor);
        if (isNaN(valorFloat) || valorFloat <= 0) {
            return axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: "❌ Valor inválido. Use /addSaldo 50,00",
            });
        }

        // Cria transação de depósito
        await Transacao.create({
            userId: user._id,
            tipo: "deposito",
            valor: valorFloat,
        });

        // Recalcula saldo após a transação
        const saldoAtual = await calcularSaldo(user.telegramId);

        // Atualiza saldo no usuário (opcional)
        user.saldo = saldoAtual;
        await user.save();

        // Envia mensagem de sucesso
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: `💰 Saldo de teste adicionado com sucesso!\nNovo saldo: R$ ${saldoAtual.toFixed(2)}`,
        });

    } catch (err) {
        console.error("Erro addSaldoTeste:", err);
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "❌ Erro ao adicionar saldo de teste.",
        });
    }
};
