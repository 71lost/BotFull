const axios = require("axios");
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;
const HistoricoGift = require("../models/Historico");

exports.mostrarHistorico = async (chatId) => {
    try {
        // Consulta o histórico de compras
        const historico = await HistoricoGift.find({ vendidoPara: chatId }).sort({ dataCompra: -1 });

        console.log("Histórico de compras encontrado:", historico);

        if (historico.length === 0) {
            // Se não houver histórico, exibe mensagem de erro
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: "❌ Você ainda não possui compras registradas no histórico.",
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
            return;
        }

        // Se houver histórico, monta o texto
        let texto = "📜 *Histórico de Compras de GIFs*\n\n";
        
        historico.forEach((item, index) => {
            texto += `🎁 Compra #${index + 1}\n`;
            texto += `💳 Cartão: *${item.cartao}*\n`;
            texto += `📅 Validade: *${item.validade}*\n`;
            texto += `🔐 Código de Segurança: *${item.cvv}*\n`;
            texto += `📅 Data de Compra: *${new Date(item.dataCompra).toLocaleDateString()}*\n\n`;
        });

        // Verifica se o texto é muito grande e divide em partes, se necessário
        if (texto.length > 4096) {
            let partes = [];
            while (texto.length > 4096) {
                partes.push(texto.slice(0, 4096));
                texto = texto.slice(4096);
            }
            partes.push(texto);

            // Envia as partes uma por uma
            for (let parte of partes) {
                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    text: parte,
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                    }
                });
            }
        } else {
            // Envia a mensagem completa de uma vez
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: texto,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "⬅️ Voltar", callback_data: "menu" }]]
                }
            });
        }

        console.log("Histórico enviado com sucesso.");
    } catch (err) {
        console.error("Erro ao mostrar o histórico:", err);
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "❌ Ocorreu um erro ao buscar seu histórico. Tente novamente mais tarde.",
            parse_mode: "Markdown"
        });
    }
};
