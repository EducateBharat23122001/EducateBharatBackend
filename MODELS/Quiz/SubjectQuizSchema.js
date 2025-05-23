const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const SubjectQuiz = new mongoose.Schema({
    subjectQuizName: {
        type: String,
        required: true
    },
    subjectQuizDescription: {
        type: String
    },
    subjectQuizImage: {
        type: String,
        default: 'noimage'
    },
    subjectQuizQNA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    subjectId: {
        type: String,
        required: true
    },
    quizType: {
        type: String,
        default: 'subject'
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


mongoose.model("SubjectQuiz", SubjectQuiz);