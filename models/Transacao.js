const mongoose = require("mongoose");

const transacaoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // <-- ObjectId
        ref: "User", // <-- nome correto do modelo de usuário
        required: true
    },
    tipo: {
        type: String,
        enum: ["deposito", "compra", "ajuste"],
        required: true
    },
    valor: {  
        type: Number,
        required: true
    },
    referenciaId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    criadoEm: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Transacao", transacaoSchema);
