// controllers/comprarController.js
const axios = require("axios");
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;
const Gift = require("../models/Gift");
const Transacao = require("../models/Transacao");
const { calcularSaldo } = require("../services/saldoService");
const User = require('../models/User');
const { mostrarBin } = require("./comprarController");
const HistoricoGift = require("../models/Historico");

 // Ajuste o caminho conforme necessário



// =========================
// MENU PRINCIPAL DE COMPRA
// =========================
exports.handleCompra = async (chatId, messageId) => {
    await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
        chat_id: chatId,
        message_id: messageId,
        media: {
            type: "photo",
            media: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
            caption: "🏪 *Escolha o que deseja comprar:*",
            parse_mode: "Markdown"
        }
    });

    await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
            inline_keyboard: [
                [{ text: "CC", callback_data: "CC" }],
                [{ text: "BIN", callback_data: "BIN" }],
                [{ text: "CC MIX", callback_data: "CC MIX" }],
                [{ text: "⬅️ Voltar", callback_data: "menu" }]
            ]
        }
    });
};

// =========================
// COMPRA DE CC
// =========================
exports.comprarCC = async (chatId, messageId) => {

    await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
        chat_id: chatId,
        message_id: messageId,
        media: {
            type: "photo",
            media: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
            caption: "🏪 * Selecione o nível que deseja comprar:*",
            parse_mode: "Markdown"
        }
    });

    await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "BLACK R$50", callback_data: "nivel_BLACK" },
                    { text: "BUSINESS R$40", callback_data: "nivel_BUSINESS" },
                ],
                [
                    { text: "CLASSIC R$35", callback_data: "nivel_CLASSIC" },
                    { text: "GOLD R$50", callback_data: "nivel_GOLD" }
                ],
                [
                    { text: "ELO R$35", callback_data: "nivel_ELO" },
                    { text: "NUBANK BLACK R$50", callback_data: "nivel_NUBANKBLACK" }
                ],
                [
                    { text: "PLATINUM R$35", callback_data: "nivel_PLATINUM" },
                    { text: "STANDARD R$35", callback_data: "nivel_STANDARD" }
                ],
                [{ text: "⬅️ Voltar", callback_data: "menu" }]
            ]
        }
    });
};

// Exportando a função mostrarBin no mesmo arquivo
// controllers/comprarController.js
exports.mostrarBin = async (chatId, messageId) => {
    // Código da função mostrarBin
    await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
        chat_id: chatId,
        message_id: messageId,
        media: {
            type: "photo",
            media: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
            caption: "🏪 *Busque pela BIN que deseja comprar:* \n\n Exemplo:\n`/bin 550671`",
            parse_mode: "Markdown"
        }
    });

    await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
            inline_keyboard: [
                [{ text: "⬅️ Voltar", callback_data: "menu" }]
            ]
        }
    });
};

exports.comprarMix = async (chatId, messageId) => {

    await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
        chat_id: chatId,
        message_id: messageId,
        media: {
            type: "photo",
            media: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
            caption: "🏪 *Escolha a opção MIX:*",
            parse_mode: "Markdown"
        }
    });

    await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
            inline_keyboard: [
                [{ text: "3 MIX - R$75", callback_data: "MIX_3" }],
                [{ text: "5 MIX - R$100", callback_data: "MIX_5" }],
                [{ text: "10 MIX - R$200", callback_data: "MIX_10" }],
                [{ text: "⬅️ Voltar", callback_data: "menu" }]
            ]
        }
    });
};

// =========================
// LISTAR POR NÍVEL (versão com ledger)
// =========================
exports.listarPorNivel = async (chatId, messageId, nivel, user) => {
    try {
        console.log(`Iniciando listagem de gifts para o nível: ${nivel}`);
        
        // 1️⃣ Calcula o saldo atual do usuário
        const saldo = await calcularSaldo(user.telegramId);
        console.log("Saldo atual do usuário:", saldo);

        // 2️⃣ Verifica se o saldo é suficiente
        if (saldo <= 0) {
            console.log("Saldo insuficiente para continuar a operação.");
            const resp = await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
                chat_id: chatId,
                message_id: messageId,
                media: {
                    type: "photo",
                    media: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
                    caption: "❌ Você não possui saldo suficiente.",
                    parse_mode: "Markdown"
                }
            });

            await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
            console.log("Mensagem de saldo insuficiente enviada.");
            return resp.data; // 🔹 Retorna dados do Telegram
        }

        // 3️⃣ Busca os gifts disponíveis para o nível solicitado
        console.log(`Buscando gifts para o nível: ${nivel}`);
        const gifts = await Gift.find({ nivel, vendido: { $ne: true } });
        console.log("Gifts encontrados:", gifts);

        if (!gifts.length) {
            console.log(`Nenhum gift encontrado para o nível: ${nivel}`);
            const resp = await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
                chat_id: chatId,
                message_id: messageId,
                media: {
                    type: "photo",
                    media: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
                    caption: `⚠️ Nenhum gift encontrado para o nível: *${nivel}*`,
                    parse_mode: "Markdown"
                }
            });

            await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
            console.log("Mensagem de sem gifts encontrada enviada.");
            return resp.data; // 🔹 Retorna dados do Telegram
        }

        // 4️⃣ Seleciona o primeiro gift disponível
        const gift = gifts[0];
        const valorGift = parseFloat(gift.valor);
        console.log(`Selecionado o gift: ${gift.cartao} com valor: R$${valorGift}`);

        // 5️⃣ Verifica se o saldo é suficiente para a compra
        if (saldo < valorGift) {
            console.log("Saldo insuficiente para comprar o gift.");
            const resp = await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
                chat_id: chatId,
                message_id: messageId,
                media: {
                    type: "photo",
                    media: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
                    caption: "❌ Saldo insuficiente para este gift.",
                    parse_mode: "Markdown"
                }
            });

            await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
            console.log("Mensagem de saldo insuficiente para gift enviada.");
            return resp.data; // 🔹 Retorna dados do Telegram
        }

        // 6️⃣ Cria a transação de compra
        console.log("Criando transação de compra...");
        await Transacao.create({
            userId: user._id,
            tipo: "compra",
            valor: valorGift,
            referenciaId: gift._id
        });

        await HistoricoGift.create({
            cartao: gift.cartao,
            validade: gift.validade,
            cvv: gift.cvv || gift.codigoSeguranca,
            vendidoPara: user.telegramId,
            dataCompra: new Date()
        });

        // 🗑️ Agora sim remove do banco
        console.log("Removendo gift do banco...");
        await Gift.deleteOne({ _id: gift._id });

        // 8️⃣ Monta texto com as informações do gift
        let texto = `🎁 *Gift comprado — ${nivel}*\n\n`;
        texto += `💳 Cartão: *${gift.cartao}*\n`;
        texto += `📅 Validade: *${gift.validade}*\n`;
        texto += `🔐 Código: *${gift.codigoSeguranca}*\n\n`;
        texto += `🏦 Banco: *${gift.banco}*\n`;
        texto += `💳 Bandeira: *${gift.bandeira}*\n\n`;
        texto += `🌍 País: *${gift.pais}*\n\n`;
        texto += `📝 Nome: *${gift.nome}*\n`;
        texto += `🆔 CPF: *${gift.cpf}*\n\n`;
        texto += `💲 Valor: *${gift.valor}*\n`;
        texto += `💵 Saldo do gift: *${gift.saldo}*\n`;

        // 9️⃣ Atualiza a mensagem com as informações do gift comprado
        console.log("Atualizando a mensagem com as informações do gift...");
        const resp = await axios.post(`${TELEGRAM_API}/editMessageMedia`, {
            chat_id: chatId,
            message_id: messageId,
            media: {
                type: "photo",
                media: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
                caption: texto,
                parse_mode: "Markdown"
            }
        });

        // 10️⃣ Atualiza os botões de volta ao menu
        console.log("Atualizando os botões para voltar ao menu...");
        await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
            }
        });

        console.log("Mensagem finalizada e enviada com sucesso.");
        return resp.data; // 🔹 Retorna dados do Telegram

    } catch (err) {
        console.error("Erro ao listarPorNivel:", err);
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "❌ Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde."
        });
    }
};

exports.listarPorBIN = async (chatId, messageId, bin, user) => {
    try {
        console.log(`Iniciando busca de gifts pelo BIN: ${bin}`);

        // 1️⃣ Calcula o saldo do usuário
        const saldo = await calcularSaldo(user.telegramId);
        console.log("Saldo atual do usuário:", saldo);

        if (saldo <= 0) {
            return axios.post(`${TELEGRAM_API}/sendPhoto`, {
                chat_id: chatId,
                photo: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
                caption: "❌ Você não possui saldo suficiente.",
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
        }

        // 2️⃣ Busca gifts que começam com a BIN
        console.log(`Buscando gifts para o BIN: ${bin}`);
        let gifts = await Gift.find({
            cartao: { $regex: "^" + bin },
            vendido: { $ne: true }
        });

        console.log("Gifts encontrados:", gifts);

        if (!gifts.length) {
            return axios.post(`${TELEGRAM_API}/sendPhoto`, {
                chat_id: chatId,
                photo: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
                caption: `⚠️ Nenhum gift encontrado para a BIN *${bin}*.`,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
        }

        // 🔥 Filtra gifts com valor válido
        gifts = gifts.filter(g => g.valor && !isNaN(parseFloat(g.valor)));

        if (!gifts.length) {
            return axios.post(`${TELEGRAM_API}/sendPhoto`, {
                chat_id: chatId,
                photo: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
                caption: `⚠️ Nenhum gift válido encontrado para a BIN *${bin}*.`,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
        }

        // 3️⃣ Seleciona o primeiro gift
        const gift = gifts[0];
        const valorGift = parseFloat(gift.valor);

        console.log(`Gift selecionado: ${gift.cartao} — R$${valorGift}`);

        if (saldo < valorGift) {
            return axios.post(`${TELEGRAM_API}/sendPhoto`, {
                chat_id: chatId,
                photo: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
                caption: "❌ Saldo insuficiente para este gift.",
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
        }

        // 4️⃣ Cria transação
       console.log("Criando transação de compra...");
        await Transacao.create({
            userId: user._id,
            tipo: "compra",
            valor: valorGift,
            referenciaId: gift._id,
            descricao: "Compra individual de gift"
});

// 🔥 Salvar no histórico ANTES de deletar
        console.log("Salvando gift no histórico...");
        await HistoricoGift.create({
            cartao: gift.cartao,
            validade: gift.validade,
            cvv: gift.cvv || gift.codigoSeguranca,
            vendidoPara: user.telegramId,
            dataCompra: new Date()
        });

        // 🗑️ Agora sim remove do banco
        console.log("Removendo gift do banco...");
        await Gift.deleteOne({ _id: gift._id });
        // 6️⃣ Monta mensagem final
        const texto = `
🎁 *Gift comprado — BIN: ${bin}*

💳 Cartão: *${gift.cartao}*
📅 Validade: *${gift.validade}*
🔐 Código: *${gift.codigoSeguranca}*

🏦 Banco: *${gift.banco}*
💳 Bandeira: *${gift.bandeira}*

🌍 País: *${gift.pais}*

📝 Nome: *${gift.nome}*
🆔 CPF: *${gift.cpf}*

💲 Valor: *${gift.valor}*
💵 Saldo do gift: *${gift.saldo}*
`.trim();

        // 7️⃣ Envia nova mensagem com o gift comprado
        const resp = await axios.post(`${TELEGRAM_API}/sendPhoto`, {
            chat_id: chatId,
            photo: "https://capitalist.com.br/wp-content/uploads/2020/09/cartoes-sem-anuidade.jpg",
            caption: texto,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
            }
        });

        return resp.data;

    } catch (err) {
        console.error("Erro ao listarPorBIN:", err);
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "❌ Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde."
        });
    }
};


exports.enviarMix = async (chatId, messageId, quantidade) => {
    try {
        const precos = { 3: 75, 5: 100, 10: 200 };
        const preco = precos[quantidade];

        // Buscar usuário
        const user = await User.findOne({ telegramId: chatId });

        if (!user) {
            return axios.post(`${TELEGRAM_API}/editMessageCaption`, {
                chat_id: chatId,
                message_id: messageId,
                caption: `❌ Não foi possível localizar seu usuário.`,
                parse_mode: "Markdown"
            });
        }

        // Usar saldo correto do ledger
        const saldo = await calcularSaldo(user.telegramId);

        if (saldo < preco) {
            return axios.post(`${TELEGRAM_API}/editMessageCaption`, {
                chat_id: chatId,
                message_id: messageId,
                caption: `❌ *Saldo insuficiente!*\n💰 Seu saldo: R$${saldo}\n💵 Valor do MIX: R$${preco}`,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
        }

        // 🔥 Buscar gifts do mesmo jeito do resto do sistema!
        const gifts = await Gift.aggregate([
            { $match: { vendido: { $ne: true } } },
            { $sample: { size: quantidade } }
        ]);

        if (gifts.length < quantidade) {
            return axios.post(`${TELEGRAM_API}/editMessageCaption`, {
                chat_id: chatId,
                message_id: messageId,
                caption: `❌ Não há gifts suficientes para gerar o MIX (${quantidade}).`,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
        }

       // Criar texto do MIX
        let texto = `🔥 *MIX (${quantidade}) gerado com sucesso!*\n`;
        texto += `💵 *Valor pago:* R$${preco}\n\n`;

        gifts.forEach((g, i) => {
            texto += `*${i + 1}️⃣*\n`;
            texto += `💳 *Cartão:* \`${g.cartao}\`\n`;
            texto += `📅 *Validade:* \`${g.validade}\`\n`;
            texto += `🔐 *CVV:* \`${g.codigoSeguranca || g.cvv}\`\n\n`;
        });

        // Edita legenda + botão voltar
        await axios.post(`${TELEGRAM_API}/editMessageCaption`, {
            chat_id: chatId,
            message_id: messageId,
            caption: texto,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "⬅️ Voltar", callback_data: "menu" }
                    ]
                ]
            }
        });

        // Criar transação debitando preço fixo
        // Criar transação debitando preço fixo
        // Criar transação debitando preço fixo
await Transacao.create({
    userId: user._id,
    tipo: "compra",
    valor: preco,
    referenciaId: null,
    descricao: `Compra MIX ${quantidade}`
});

// 🔥 Salvar no histórico
        const historicoData = gifts.map(g => ({
            cartao: g.cartao,
            validade: g.validade,
            cvv: g.codigoSeguranca || g.cvv,
            vendidoPara: user.telegramId
        }));

        await HistoricoGift.insertMany(historicoData);

        // 🗑️ Remover da coleção original
        await Gift.deleteMany({ _id: { $in: gifts.map(g => g._id) } });


    } catch (err) {
        console.error("Erro MIX:", err);
    }
};
