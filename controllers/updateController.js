// controllers/updateController.js
const { handleMessage } = require("./messageController");
const { handleCallback } = require("./callbackController");

exports.handleUpdate = async (req, res) => {
    const update = req.body;

    try {
        if (update.message) {
            await handleMessage(update.message);
        }

        if (update.callback_query) {
            await handleCallback(update.callback_query);
        }

        res.sendStatus(200);

    } catch (err) {
        console.error("Erro no update:", err);
        res.sendStatus(500);
    }
};
