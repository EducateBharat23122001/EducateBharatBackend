const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const Course = new mongoose.Schema({
    coursePrice: {
        type: String,
    },
    courseDiscount: {
        type: Number,
        default:0
    },
    courseCategory: {
        type: String,
        default: 'PAID'
    },
    coursePriceCurrency: {
        type: String,
        default: 'INR'
    },
    courseSubjects: {
        type: Array,
        default: []
    },
    courseName: {
        type: String,
        required: true
    },
    courseDescription: {
        type: String,
        default: ''
    },
    courseImage: {
        type: String,
        default: 'noimage'
    },
    courseRating: {
        type: String,
        default: '0'
    },
    courseReviews: {
        type: Array,
        default: []
    },
    courseQuizzes: {
        type: Array,
        default: []
    },
    introVideo: {
        type: String,
        default: ''
    },
    disabled: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    });


mongoose.model("Course", Course);