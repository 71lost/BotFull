const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

async function gerarPix(valor) {
    try {
        const idempotencyKey = uuidv4();

        const response = await axios.post(
            "https://api.mercadopago.com/v1/payments",
            {
                transaction_amount: Number(valor.toFixed(2)),
                description: "Depósito via Bot Telegram",
                payment_method_id: "pix",
                payer: {
                    email: "lucasa7vs@gmail.com" // ideal: email do usuário real
                }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                    "X-Idempotency-Key": idempotencyKey
                }
            }
        );

        return {
            id: response.data.id, // ← Este ID é o que o webhook vai receber
            qrCodeUrl: response.data.point_of_interaction.transaction_data.qr_code_base64,
            copiaCola: response.data.point_of_interaction.transaction_data.qr_code
        };

    } catch (error) {
        console.log("Erro ao gerar PIX:", error.response?.data || error.message);
        return null;
    }
}

module.exports = { gerarPix };
