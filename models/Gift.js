const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    estado: { type: Number, default: 0 },

    cartao: String,
    validade: String,
    codigoSeguranca: String,
    bandeira: String,
    nivel: { type: String, uppercase: true, trim: true },
    banco: String,
    pais: String,
    nome: String,
    cpf: String,

    saldo: {
        type: Number,
        default: 0
    },

    // 🔥 Campo protegido
    valor: {
        type: Number,
        required: true,
        set: v => {
            if (v === null || v === undefined || v === "") return undefined;

            // caso o valor seja string com vírgula, converte
            if (typeof v === "string") {
                v = v.replace(",", ".");
            }

            const num = Number(v);
            return isNaN(num) ? undefined : num;
        }
    }
});

const Gift = mongoose.model('card', giftSchema);

module.exports = Gift;
