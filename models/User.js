const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    telegramId: {
        type: Number,
        required: true,
        unique: true
    },
    username: String,
    first_name: String,
    lastMessageId: Number,
    giftsComprados: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Gift"
    }],
    state: {
        type: String,
        default: "new"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Modelo padronizado: User
module.exports = mongoose.model("Userss", UserSchema);
