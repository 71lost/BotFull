const axios = require("axios");
const Deposito = require("../models/Deposito");
const Transacao = require("../models/Transacao");
const User = require("../models/User");

exports.mpWebhook = async (req, res) => {
    try {
        const evento = req.body;

        // Log para depuração
        console.log("Evento recebido:", evento);

        // Verifica se o tipo do evento é 'payment'
        if (evento.type !== "payment") {
            return res.sendStatus(200);  // Ignora outros tipos de eventos
        }

        const mpId = evento.data.id;
        console.log("Pagamento ID:", mpId);

        // Busca os detalhes reais do pagamento no Mercado Pago
        const pag = await axios.get(
            `https://api.mercadopago.com/v1/payments/${mpId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
                }
            }
        );

        const status = pag.data.status;
        console.log("Status do pagamento:", status);

        // Verifica o depósito pendente com o paymentId
        const dep = await Deposito.findOne({ paymentId: mpId });
        if (!dep) {
            console.log(`Depósito não encontrado para o pagamento ID: ${mpId}`);
            return res.sendStatus(200);  // Não há depósito relacionado
        }

        // Verifica se o depósito já foi processado
        if (dep.status === "aprovado") {
            console.log(`Depósito já aprovado para o pagamento ID: ${mpId}`);
            return res.sendStatus(200);
        }

        // Processa o pagamento se aprovado
        if (status === "approved") {
            dep.status = "aprovado";
            await dep.save();
            console.log(`Depósito aprovado: R$${dep.valor} para ${dep.telegramId}`);

            // Buscar o usuário para registrar a transação
            const user = await User.findOne({ telegramId: dep.telegramId });
            if (!user) {
                console.log(`Usuário não encontrado para o Telegram ID: ${dep.telegramId}`);
                return res.sendStatus(200);
            }

            // Registrar a transação no ledger
           await Transacao.create({
                userId: user._id,  // ObjectId correto
                tipo: "deposito",
                valor: dep.valor,
                referenciaId: dep._id
            });



            console.log(`Transação registrada para o usuário ${user.telegramId}: R$${dep.valor}`);
        }

        return res.sendStatus(200);  // Confirmação de que o processamento foi bem-sucedido

    } catch (e) {
        // Log detalhado do erro
        console.error("Erro no webhook:", e.message);
        return res.sendStatus(500);  // Retorna erro 500 para falha no processamento
    }
};
