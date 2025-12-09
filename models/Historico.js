const mongoose = require("mongoose");

const HistoricoGiftSchema = new mongoose.Schema({
    cartao: String,
    validade: String,
    cvv: String,
    vendidoPara: String,      // telegramId do usuário que comprou
    dataCompra: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HistoricoGift", HistoricoGiftSchema);
