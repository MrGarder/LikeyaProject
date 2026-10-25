const mongoose = require('mongoose');

const presentationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    slidesCount: { type: Number, required: true },
    fileType: { type: String, enum: ['PDF', 'PPTX'], default: 'PDF' },
    fileUrl: { type: String, required: true },
    author: { type: String, default: 'LikeyaProject Press' },
    downloadsCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Presentation', presentationSchema);