const Transacao = require("../models/Transacao");
const User = require("../models/User");
const mongoose = require("mongoose");

const calcularSaldo = async (telegramId) => {
    // Busca o usuário pelo telegramId (Number)
    const user = await User.findOne({ telegramId });
    if (!user) return 0;

    // Busca transações usando ObjectId do usuário
    const transacoes = await Transacao.find({ userId: user._id });

    let saldo = 0;
    transacoes.forEach(t => {
        if (t.tipo === "deposito" || t.tipo === "ajuste") saldo += t.valor;
        if (t.tipo === "compra") saldo -= t.valor;
    });

    return saldo;
};
module.exports = { calcularSaldo };
