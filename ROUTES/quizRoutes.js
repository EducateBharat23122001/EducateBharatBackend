const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Course = mongoose.model('Course');
const Subject = mongoose.model('Subject');
const Chapter = mongoose.model('Chapter');
const ChapterQuiz = mongoose.model('ChapterQuiz');
const SubjectQuiz = mongoose.model('SubjectQuiz');
const CourseQuiz = mongoose.model('CourseQuiz');
const Question = mongoose.model('Question');
const User = mongoose.model('User');
const adminTokenHandler = require('../Middleware/AdminVerificationMiddleware');

const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

// add quiz to chapter
app.post('/createQuizForChapter', async (req, res) => {
    //chapterId, quizName
    const { chapterId, chapterQuizName } = req.body;
    const chapter = await Chapter.findById(chapterId);

    const newChapterQuiz = new ChapterQuiz({
        chapterQuizName,
        chapterId
    });

    const savedChapterQuiz = await newChapterQuiz.save();

    chapter.chapterQuizzes.push({ chapterQuizName: savedChapterQuiz.chapterQuizName, _id: savedChapterQuiz._id, access: savedChapterQuiz.access });

    chapter.save().then(chapter => {
        res.json({ message: "success", chapter }).status(200);
    }).catch(err => {
        res.json({ error: "Error in adding quiz to chapter" }).status(500);
        console.log(err);
    });
});

app.post('/deleteQuizFromChapter', async (req, res) => {
    const { quizId, chapterId } = req.body;

    try {
        // Find the chapter
        const chapter = await Chapter.findById(chapterId);

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Remove the quiz from the chapter's chapterQuizzes array
        const updatedQuizzes = chapter.chapterQuizzes.filter(quiz => quiz._id.toString() !== quizId);

        // Update the chapter's quizzes
        chapter.chapterQuizzes = updatedQuizzes;

        await chapter.save();

        // Now delete the quiz itself from the ChapterQuiz collection
        await ChapterQuiz.findByIdAndDelete(quizId);

        res.status(200).json({ message: 'Quiz deleted successfully from chapter and database', chapter });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ message: 'Error deleting quiz', error });
    }
});



app.post('/createQuizForSubject', async (req, res) => {
    // same as above
    const { subjectId, subjectQuizName } = req.body;
    const subject = await Subject.findById(subjectId);

    const newSubjectQuiz = new SubjectQuiz({
        subjectQuizName,
        subjectId,
    });

    const savedSubjectQuiz = await newSubjectQuiz.save();

    // console.log(subject);

    subject.subjectQuizzes.push({ subjectQuizName: savedSubjectQuiz.subjectQuizName, _id: savedSubjectQuiz._id, access: savedSubjectQuiz.access });

    subject.save().then(subject => {
        res.json({ message: "success", subject }).status(200);
    }
    ).catch(err => {
        res.json({ error: "Error in adding quiz to subject" }).status(500);
        console.log(err);
    }
    );
});

app.post('/deleteQuizFromSubject', async (req, res) => {
    const { quizId, subjectId } = req.body;

    try {
        // Find the subject by its ID
        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Filter out the quiz from the subject's quizzes array
        const updatedQuizzes = subject.subjectQuizzes.filter(quiz => quiz._id.toString() !== quizId);

        subject.subjectQuizzes = updatedQuizzes;

        // Save the updated subject
        await subject.save();

        // Delete the quiz from the database
        await SubjectQuiz.findByIdAndDelete(quizId);

        res.status(200).json({ message: 'Quiz deleted successfully from subject and database', subject });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ message: 'Error deleting quiz from subject', error });
    }
});

app.post('/createQuizForCourse', adminTokenHandler, async (req, res) => {
    // same as above
    const { courseId, courseQuizName } = req.body;
    const course = await Course.findById(courseId);

    const newCourseQuiz = new CourseQuiz({
        courseQuizName,
        courseId
    });

    const savedCourseQuiz = await newCourseQuiz.save();

    course.courseQuizzes.push({ courseQuizName: savedCourseQuiz.courseQuizName, _id: savedCourseQuiz._id, access: savedCourseQuiz.access });

    course.save().then(course => {
        res.json({ message: "success", course }).status(200);
    }
    ).catch(err => {
        res.json({ error: "Error in adding quiz to course" }).status(500);
        console.log(err);
    }
    );

});

app.post('/deleteQuizFromCourse', adminTokenHandler, async (req, res) => {
    const { courseId, quizId } = req.body;

    try {
        // Find the course by ID
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Remove the quiz from course's quizzes array
        course.courseQuizzes = course.courseQuizzes.filter(quiz => quiz._id.toString() !== quizId);

        // Save the updated course
        await course.save();

        // Delete the quiz itself from the CourseQuiz collection
        const deletedQuiz = await CourseQuiz.findByIdAndDelete(quizId);

        if (!deletedQuiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        res.status(200).json({ message: "Quiz deleted successfully from course and database", course });
    } catch (error) {
        console.error('Error deleting quiz from course:', error);
        res.status(500).json({ error: "An error occurred while deleting the quiz" });
    }
});

// add question to quiz
app.post('/addQuestionToQuiz', async (req, res) => {
    const { questionName, questionType, quizType, quizId, questionOptions, questionAnswer, questionOrder, questionMarks, questionNegativeMarks, questionSubject, questionPdf } = req.body;
    // console.log(req.body);
    // return res.status(200).json({ message: "success", quiz:{} });
    // console.log({ questionName, questionType, quizType, quizId, questionOptions, questionAnswer, questionMarks, questionNegativeMarks, questionSubject, questionPdf })
    try {
        // First, create and save the question to the questions collection
        const newQuestion = new Question({
            questionName,
            questionType,
            quizType,
            quizId,
            questionOptions,
            questionAnswer,
            questionMarks,
            questionNegativeMarks,
            questionSubject,
            questionPdf,
            questionOrder
        });

        const savedQuestion = await newQuestion.save();


        // Now, add the saved question's ID to the respective quiz's question array
        if (quizType === "chapter") {
            const quiz = await ChapterQuiz.findById(quizId);
            if (!quiz) return res.status(404).json({ error: "Chapter quiz not found" });

            quiz.chapterQuizQNA.push(savedQuestion._id);
            await quiz.save();
            return res.status(200).json({ message: "success", quiz });
        }
        else if (quizType === "subject") {
            const quiz = await SubjectQuiz.findById(quizId);
            if (!quiz) return res.status(404).json({ error: "Subject quiz not found" });

            quiz.subjectQuizQNA.push(savedQuestion._id);
            await quiz.save();
            return res.status(200).json({ message: "success", quiz });
        }
        else if (quizType === "course") {
            const quiz = await CourseQuiz.findById(quizId);
            if (!quiz) return res.status(404).json({ error: "Full course quiz not found" });

            quiz.courseQuizQNA.push(savedQuestion._id);
            await quiz.save();
            return res.status(200).json({ message: "success", quiz });
        }
        else {
            return res.status(400).json({ error: "Invalid quiz type" });
        }
    } catch (error) {
        console.error("Error in adding question to quiz:", error);
        return res.status(500).json({ error: "Error in adding question to quiz" });
    }
});


app.post('/updateQuestionPdf', async (req, res) => {
    const { questionId, questionPdf } = req.body; // Extract the new PDF URL from the request body

    if (!questionPdf) {
        return res.status(400).json({ error: "questionPdf is required" });
    }

    try {
        // Find the question by ID and update the questionPdf field
        const updatedQuestion = await Question.findByIdAndUpdate(
            questionId,
            { questionPdf },
            { new: true } // Return the updated document
        );

        if (!updatedQuestion) {
            return res.status(404).json({ error: "Question not found" });
        }

        return res.status(200).json({ message: "success", question: updatedQuestion });
    } catch (error) {
        console.error("Error updating question:", error);
        return res.status(500).json({ error: "An error occurred while updating the question" });
    }
});

app.post('/updateQuestion', async (req, res) => {
    const { question } = req.body; // Get the fields to be updated from the request body

    try {
        // Find the question by ID and update it with the provided fields
        const updatedQuestion = await Question.findByIdAndUpdate(
            question._id,
            question,
            { new: true, runValidators: true } // Return updated document and run validation
        );

        if (!updatedQuestion) {
            return res.status(404).json({ error: "Question not found" });
        }

        return res.status(200).json({ message: "success", question: updatedQuestion });
    } catch (error) {
        console.error("Error updating question:", error);
        return res.status(500).json({ error: "An error occurred while updating the question" });
    }
});


app.post('/getQuizData', async (req, res) => {
    try {
        const { quizId, quizType } = req.body;

        // Validate the inputs
        if (!quizId || !quizType) {
            return res.status(400).json({ message: "Invalid input. quizId and quizType are required." });
        }

        let quizModified;

        // Fetch data based on quizType
        if (quizType === "chapter") {
            let quiz = await ChapterQuiz.findById(quizId).populate({
                path: 'chapterQuizQNA',
                select: '-__v -createdAt -updatedAt', // Exclude unnecessary fields if required
            })
            if (!quiz) return res.status(404).json({ message: "Chapter Quiz not found." });

            quizModified = {
                ...quiz.toObject(), // Convert to plain JS object
                parentId: quiz.chapterId,
                quizImage: quiz.chapterQuizImage,
                quizName: quiz.chapterQuizName,
                quizQNA: quiz.chapterQuizQNA,
            };
        } else if (quizType === "subject") {
            let quiz = await SubjectQuiz.findById(quizId).populate({
                path: 'subjectQuizQNA',
                select: '-__v -createdAt -updatedAt', // Exclude unnecessary fields if required
            })
            if (!quiz) return res.status(404).json({ message: "Subject Quiz not found." });
            quizModified = {
                ...quiz.toObject(), // Convert to plain JS object
                parentId: quiz.subjectId,
                quizImage: quiz.subjectQuizImage,
                quizName: quiz.subjectQuizName,
                quizQNA: quiz.subjectQuizQNA,
            };
        } else if (quizType === "course") {
            let quiz = await CourseQuiz.findById(quizId).populate({
                path: 'courseQuizQNA',
                select: '-__v -createdAt -updatedAt', // Exclude unnecessary fields if required
            })
            if (!quiz) return res.status(404).json({ message: "Course Quiz not found." });
            quizModified = {
                ...quiz.toObject(), // Convert to plain JS object
                parentId: quiz.courseId,
                quizImage: quiz.courseQuizImage,
                quizName: quiz.courseQuizName,
                quizQNA: quiz.courseQuizQNA,
            };
        } else {
            return res.status(400).json({ message: "Invalid quizType provided." });
        }

        // Respond with the quiz data
        return res.status(200).json({ message: "success", quiz: quizModified });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ message: "An error occurred.", error: error.message });
    }
});
app.post('/updateQuizById', async (req, res) => {
    try {
        const { quiz } = req.body;

        // Validate required fields
        if (!quiz || !quiz._id || !quiz.quizType) {
            return res.status(400).json({ message: "Invalid input. Quiz data is required." });
        }

        let updateFields = {
            access: quiz.access,
            timeLimit: quiz.timeLimit
        };

        if (quiz.quizType === "chapter") {
            updateFields.chapterQuizName = quiz.quizName;
            updatedQuiz = await ChapterQuiz.findByIdAndUpdate(quiz._id, updateFields, { new: true });

        } else if (quiz.quizType === "subject") {
            updateFields.subjectQuizName = quiz.quizName;
            updatedQuiz = await SubjectQuiz.findByIdAndUpdate(quiz._id, updateFields, { new: true });

        } else if (quiz.quizType === "course") {
            updateFields.courseQuizName = quiz.quizName;
            updatedQuiz = await CourseQuiz.findByIdAndUpdate(quiz._id, updateFields, { new: true });

        } else {
            return res.status(400).json({ message: "Invalid quizType provided." });
        }

        if (!updatedQuiz) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        return res.status(200).json({ message: "success" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred.", error: error.message });
    }
});

app.post('/getQuestionData', async (req, res) => {
    try {
        const { questionId } = req.body;

        // Validate input
        if (!questionId) {
            return res.status(400).json({ message: "Invalid input. questionId is required." });
        }

        // Fetch the question from the database
        const question = await Question.findById(questionId);

        // If the question is not found, return an error response
        if (!question) {
            return res.status(404).json({ message: "Question not found." });
        }

        // Return the question data
        return res.status(200).json({
            message: "success",
            question,
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ message: "An error occurred.", error: error.message });
    }
});


app.post('/getQuizStartData', async (req, res) => {
    const { quizId, quizType } = req.body;

    try {
        let quiz;
        if (quizType === "chapter") {
            // Exclude chapterQuizQNA field from the result
            quiz = await ChapterQuiz.findById(quizId).select('-chapterQuizQNA');
        } else if (quizType === "subject") {
            // Exclude subjectQuizQNA field from the result
            quiz = await SubjectQuiz.findById(quizId).select('-subjectQuizQNA');
        } else if (quizType === "course") {
            // Exclude courseQuizQNA field from the result
            quiz = await CourseQuiz.findById(quizId).select('-courseQuizQNA');
        } else {
            return res.status(400).json({ error: "Invalid quiz type" });
        }

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        res.status(200).json({ message: "success", quiz });
    } catch (error) {
        console.error("Error fetching quiz:", error);
        res.status(500).json({ error: "Error fetching quiz data" });
    }
});


app.post('/getQuizQuestionsData', async (req, res) => {
    const { quizId, quizType } = req.body;

    try {
        let quizQuestions;
        let populateField;

        if (quizType === "chapter") {
            populateField = "chapterQuizQNA";
            quizQuestions = await ChapterQuiz.findById(quizId).select(populateField).populate(populateField);
        } else if (quizType === "subject") {
            populateField = "subjectQuizQNA";
            quizQuestions = await SubjectQuiz.findById(quizId).select(populateField).populate(populateField);
        } else if (quizType === "course") {
            populateField = "courseQuizQNA";
            quizQuestions = await CourseQuiz.findById(quizId).select(populateField).populate(populateField);
        } else {
            return res.status(400).json({ error: "Invalid quiz type" });
        }

        if (!quizQuestions) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        res.status(200).json({ message: "success", quizQuestions });
    } catch (error) {
        console.error("Error fetching quiz:", error);
        res.status(500).json({ error: "Error fetching quiz data" });
    }
});


app.post('/deleteQuestion', async (req, res) => {
    const { quizId, quizType, questionId } = req.body;

    try {
        console.log("Request received with:", { quizId, quizType, questionId });

        // Step 1: Remove the question from the questions collection
        const deletedQuestion = await Question.findByIdAndDelete(questionId);
        if (!deletedQuestion) {
            return res.status(404).json({ error: "Question not found" });
        }

        let quiz;
        let field;

        if (quizType === "chapter") {
            // Exclude chapterQuizQNA field from the result
            ChapterQuiz.findById(quizId).then((result) => {
                quiz = result;
                field = 'chapterQuizQNA';
                processQuiz();
            }).catch((err) => {
                return res.status(500).json({ error: "Error fetching ChapterQuiz", details: err.message });
            });
        } else if (quizType === "subject") {
            // Exclude subjectQuizQNA field from the result
            SubjectQuiz.findById(quizId).then((result) => {
                quiz = result;
                field = 'subjectQuizQNA';
                processQuiz();
            }).catch((err) => {
                return res.status(500).json({ error: "Error fetching SubjectQuiz", details: err.message });
            });
        } else if (quizType === "course") {
            // Exclude courseQuizQNA field from the result
            CourseQuiz.findById(quizId).then((result) => {
                quiz = result;
                field = 'courseQuizQNA';
                processQuiz();
            }).catch((err) => {
                return res.status(500).json({ error: "Error fetching CourseQuiz", details: err.message });
            });
        } else {
            return res.status(400).json({ error: "Invalid quiz type" });
        }

        function processQuiz() {
            if (!quiz) {
                return res.status(404).json({ error: "Quiz not found" });
            }

            // Step 3: Filter out the question ID from the quiz's question array
            quiz[field] = quiz[field].filter((qId) => qId.toString() !== questionId);

            // Save the updated quiz
            quiz.save()
                .then(() => {
                    console.log("Updated quiz saved successfully");
                    res.status(200).json({ message: "success" });
                })
                .catch((err) => {
                    res.status(500).json({ error: "Error saving quiz", details: err.message });
                });
        }

    } catch (err) {
        console.error("Error deleting question:", err);
        res.status(500).json({ error: "Error in deleting question from quiz" });
    }
});


app.post('/submitQuiz', async (req, res) => {
    const { quizId, quizType, score, total, createdAt, userAnswers } = req.body;
    const token = req.headers.authorization.split(" ")[1];

    try {
        // Decode the token to get user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { _id } = decoded;

        // Find the user in the database
        const user = await User.findById(_id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the quiz has already been taken
        const existingQuizIndex = user.testScores.findIndex(score => score.quizId === quizId);

        if (existingQuizIndex !== -1) {
            // If quiz exists, delete the previous one and overwrite with the latest data
            user.testScores.splice(existingQuizIndex, 1);
        }

        // Add the new quiz result
        user.testScores.push({ quizId, quizType, score, total, createdAt, userAnswers });

        // Save the user data
        await user.save();

        // Respond with success
        res.json({ message: "Quiz submitted successfully" }).status(200);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error in submitting quiz" });
    }
});



app.post('/addAfterSubmissionPdfToQuiz', async (req, res) => {
    const { quizId, quizType, pdfLink } = req.body;
    // console.log({ quizId, quizType, pdfLink })
    // return res.json({ error: "Error in adding pdf to quiz" }).status(500);
    if (quizType == "chapter") {
        const quiz = await ChapterQuiz.findById(quizId);
        quiz.afterSubmissionPdf = pdfLink;

        quiz.save().then(quiz => {
            res.json({ message: "success", quiz }).status(200);
        }).catch(err => {
            res.json({ error: "Error in adding pdf to quiz" }).status(500);
            console.log(err);
        });
    }

    else if (quizType == "subject") {
        const quiz = await SubjectQuiz.findById(quizId);
        quiz.afterSubmissionPdf = pdfLink;

        quiz.save().then(quiz => {
            res.json({ message: "success", quiz }).status(200);
        }
        ).catch(err => {
            res.json({ error: "Error in adding pdf to quiz" }).status(500);
            console.log(err);
        }
        );
    }

    else if (quizType == "course") {
        const quiz = await CourseQuiz.findById(quizId);
        quiz.afterSubmissionPdf = pdfLink;

        quiz.save().then(quiz => {
            res.json({ message: "success", quiz }).status(200);
        }
        ).catch(err => {
            res.json({ error: "Error in adding pdf to quiz" }).status(500);
            console.log(err);
        }
        );
    }
});

app.post('/updateTimeLimit', async (req, res) => {
    const { quizId, quizType, timeLimit } = req.body;

    if (quizType == "chapter") {
        const quiz = await ChapterQuiz.findById(quizId);
        quiz.timeLimit = timeLimit;
        quiz.save().then(quiz => {
            res.json({ message: "success", quiz }).status(200);
        }).catch(err => {
            res.json({ error: "Error in adding timeLimit to quiz" }).status(500);
            console.log(err);
        });
    }
    else if (quizType == "subject") {
        const quiz = await SubjectQuiz.findById(quizId);
        quiz.timeLimit = timeLimit;

        quiz.save().then(quiz => {
            res.json({ message: "success", quiz }).status(200);
        }
        ).catch(err => {
            res.json({ error: "Error in adding timeLimit to quiz" }).status(500);
            console.log(err);
        }
        );
    }
    else if (quizType == "course") {
        const quiz = await CourseQuiz.findById(quizId);
        quiz.timeLimit = timeLimit;

        quiz.save().then(quiz => {
            res.json({ message: "success", quiz }).status(200);
        }
        ).catch(err => {
            res.json({ error: "Error in adding timeLimit to quiz" }).status(500);
            console.log(err);
        }
        );
    }
})


app.post('/mapAnswers', async (req, res) => {
    const { quizId, quizType, answersArray } = req.body;
    console.log({ quizId, quizType, answersArray });

    try {
        // Validate input
        if (!quizId || !quizType || !answersArray) {
            return res.status(400).json({ error: 'Please provide quizId, quizType, and answerString' });
        }

        // Retrieve the quiz based on quizId and quizType
        let quiz;
        if (quizType === 'chapter') {
            quiz = await ChapterQuiz.findById(quizId).populate('chapterQuizQNA');
        } else if (quizType === 'subject') {
            quiz = await SubjectQuiz.findById(quizId).populate('subjectQuizQNA');
        } else if (quizType === 'course') {
            quiz = await CourseQuiz.findById(quizId).populate('courseQuizQNA');
        } else {
            return res.status(400).json({ error: 'Invalid quiz type' });
        }

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }


        const questionIds = quiz[`${quizType}QuizQNA`].map(q => q._id);

        if (answersArray.length !== questionIds.length) {
            return res.status(400).json({
                error: `Mismatch: ${answersArray.length} answers provided for ${questionIds.length} questions.`
            });
        }

        // Map answers to questions
        const results = [];
        for (let i = 0; i < questionIds.length; i++) {
            const questionId = questionIds[i];
            const rawAnswer = answersArray[i];


            // Handle single answers
            questionAnswer = rawAnswer;
            console.log(questionAnswer)

            // Update the question's answer
            const updatedQuestion = await Question.findByIdAndUpdate(
                questionId,
                { questionAnswer },
                { new: true }
            );

            results.push({
                questionId,
                status: 'updated',
                updatedAnswer: questionAnswer,
            });
        }

        // Send response
        res.status(200).json({
            message: 'Answers mapped and questions updated successfully',
            results,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = app;