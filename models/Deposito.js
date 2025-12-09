const mongoose = require("mongoose");

const depositoSchema = new mongoose.Schema({
    telegramId: Number,
    valor: Number,
    paymentId: String,
    status: {
        type: String,
        default: "pendente" // pendente / aprovado / recusado
    },
    criadoEm: Date
});

module.exports = mongoose.model("Deposito", depositoSchema);
