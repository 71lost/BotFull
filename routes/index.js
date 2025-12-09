// routes/telegramRoutes.js
const express = require('express');
const router = express.Router();

const message = require('../controllers/messageController');
const callback = require('../controllers/callbackController');

// ✔ Rota única, limpa e sem duplicação
router.post("/webhook", async (req, res) => {
    const update = req.body;

    try {
        if (update.callback_query) {
            await callback.handleCallback(update);
            return res.sendStatus(200);
        }

        if (update.message) {
            await message.handleMessage(update.message);
            return res.sendStatus(200);
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error("Erro no webhook:", error.message);
        return res.sendStatus(500);
    }
});

module.exports = router;
