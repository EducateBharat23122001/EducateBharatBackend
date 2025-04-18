const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const ChapterQuiz = new mongoose.Schema({
    chapterQuizName: {
        type: String,
        required: true
    },
    chapterQuizDescription: {
        type: String
    },
    chapterQuizImage: {
        type: String,
        default: 'noimage'
    },
    chapterQuizQNA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    chapterId: {
        type: String,
        required: true
    },
    quizType: {
        type: String,
        default: 'chapter'
    },
    access: {
        type: String,
        default: 'PAID'
    },
    afterSubmissionPdf: {
        type: String,
        default: null
    },
    timeLimit: {
        type: Number,
        default: 60000
        // 60000 ms = 1 minute
    }



},
    {
        timestamps: true
    });


mongoose.model("ChapterQuiz", ChapterQuiz);