const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

dotenv.config();
const app = express();

app.use(bodyParser.json());

// Rotas
const telegramRoutes = require('./routes');
app.use('/', telegramRoutes);

// Variáveis
const { BOT_TOKEN, URL_NGROK } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBHOOK_URL = `${URL_NGROK}/webhook`;  // <-- CORRETO

// Set webhook
const setWebhook = async () => {
    try {
        await axios.post(`${TELEGRAM_API}/setWebhook`, { url: WEBHOOK_URL });
        console.log("Webhook setado com sucesso:", WEBHOOK_URL);
    } catch (error) {
        console.error("Erro ao setar webhook:", error.response?.data || error);
    }
};

app.post("/webhook", async (req, res) => {
    try {
        const message = req.body.message || req.body.callback_query?.message;
        const chatId = message?.chat?.id;
        const userId = req.body.message?.from?.id || req.body.callback_query?.from?.id;
        const text = req.body.message?.text;

        if (!chatId || !userId) return res.sendStatus(400);

        // Comando /pix
        if (text && text.startsWith("/pix")) {
            const parts = text.split(" ");
            const valor = parseFloat(parts[1]);

            if (!isNaN(valor) && valor > 0) {
                const user = await User.findOne({ telegramId: userId });
                if (!user) {
                    await axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: chatId,
                        text: "❌ Usuário não encontrado."
                    });
                    return res.sendStatus(404);
                }
                await depositoController.handlePixGerar(chatId, valor, user._id);
                return res.sendStatus(200);
            } else {
                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    text: "❌ Valor inválido. Use /pix {valor}, ex: /pix 50"
                });
                return res.sendStatus(400);
            }
        }

        // Callback queries
        if (req.body.callback_query) {
            await handleCallback(req.body);
        }

        res.sendStatus(200);

    } catch (err) {
        console.error("Erro no webhook:", err.message);
        res.sendStatus(500);
    }
});


// Mongo
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado ao MongoDB com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
    }
};

connectDB();

app.listen(process.env.PORT, async () => {
    console.log("Servidor rodando na porta:", process.env.PORT);
    setWebhook();
});
