const mongoose = require('mongoose'); 
const playerSchema = new mongoose.Schema({
    userID: { type: String, require: true, unique: true},
    coins: { type: Number, default: 0},
    maids: { type: Array, default: []},
    currentUnit: { type: String, default: "N/A"},
    currentParty: { type: Array, default: []},
    badges: { type: Array, default: []}
    


})

const model = mongoose.model('PlayerModels', playerSchema);

module.exports = model;