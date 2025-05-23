const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Course = mongoose.model('Course');
const Subject = mongoose.model('Subject');
const Chapter = mongoose.model('Chapter');

const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const adminTokenHandler = require('../Middleware/AdminVerificationMiddleware');

app.post('/addCourse', async (req, res) => {
    // later add authentication

    const { courseName } = req.body;



    const newCourse = new Course({
        courseName
    });

    newCourse.save().then(course => {
        res.json({ message: "Course added successfully", course }).status(200);
    }).catch(err => {
        res.json({ error: "Error in adding course" }).status(500);
        console.log(err);
    });


});
app.post('/allCourses', async (req, res) => {
    const { isUser } = req.body || {};
    const courses = isUser ?
        await Course.find({
            $or: [
                { disabled: false }, // Include if `disabled` is explicitly false
                { disabled: { $exists: false } } // Include if `disabled` field is missing
            ]
        }) :
        await Course.find()
        ;
    res.json({ courses }).status(200);
});
app.post('/getSomeCourses', async (req, res) => {
    const { limit } = req.body;

    try {
        const courses = await Course.find({
            $or: [
                { disabled: false }, // Include if `disabled` is explicitly false
                { disabled: { $exists: false } } // Include if `disabled` field is missing
            ]
        }) // Filter by `disabled: false`
            .sort({ createdAt: -1 }) // Sort by creation date in descending order
            .limit(limit)             // Limit the number of results
            .select('courseName coursePrice courseDescription courseImage'); // Select specific fields
        console.log(courses);
        res.status(200).json({ courses });
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});

app.post('/searchCourses', async (req, res) => {
    const { query } = req.body;
    try {
        const courses = await Course.find({
            courseName: { $regex: query, $options: 'i' },
        })
            .limit(3)
            .select('courseName coursePrice courseDescription courseImage'); // Select specific fields

        res.status(200).json({ courses });
    } catch (error) {
        console.error("Error searching courses:", error);
        res.status(500).json({ error: "Failed to search courses" });
    }
});

app.post('/courseintrobycourseid', async (req, res) => {
    const { courseId } = req.body;
    const course = await Course.findById(courseId).select('-courseQuizzes -courseSubjects');
    res.json({ course, message: 'success' }).status(200);
});

app.post('/coursebycourseid', async (req, res) => {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    res.json({ course, message: 'success' }).status(200);
});

app.post('/deletecoursebyid', (req, res) => {
    const { courseId } = req.body;

    // Find the course by ID
    Course.findById(courseId)
        .then((course) => {
            if (!course) {
                return res.status(404).json({ error: "Course not found" });
            }

            // Delete the course
            Course.findByIdAndDelete(courseId)
                .then(() => {
                    res.status(200).json({ message: "Course deleted successfully" });
                })
                .catch((err) => {
                    res.status(500).json({ error: "Error deleting course", details: err.message });
                });
        })
        .catch((err) => {
            res.status(500).json({ error: "Error finding course", details: err.message });
        });
});


app.post('/courseqnabycourseid', async (req, res) => {
    const { courseId } = req.body;
    const course = await Course.findById(courseId).select('courseQuizzes courseSubjects');
    res.json({ course, message: 'success' }).status(200);
});

app.patch('/saveEditedCourseById', adminTokenHandler, async (req, res) => {
    const { _id, courseName, coursePrice, courseDescription, courseImage, courseCategory, courseRating, disabled, courseDiscount } = req.body;

    try {
        const course = await Course.findById(_id);

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Update fields only if the new value is different from the existing value
        if (courseName !== undefined && courseName !== course.courseName) {
            course.courseName = courseName;
        }
        if (coursePrice !== undefined && coursePrice !== course.coursePrice) {
            course.coursePrice = coursePrice;
        }
        if (courseDescription !== undefined && courseDescription !== course.courseDescription) {
            course.courseDescription = courseDescription;
        }
        if (courseCategory !== undefined && courseCategory !== course.courseCategory) {
            course.courseCategory = courseCategory;
        }
        if (courseRating !== undefined && courseRating !== course.courseRating) {
            course.courseRating = courseRating;
        }
        if (courseImage !== undefined && courseImage !== course.courseImage) {
            course.courseImage = courseImage;
        }
        if (disabled !== undefined && disabled !== course.disabled) {
            course.disabled = disabled;
        }
        if (courseDiscount !== undefined && courseDiscount !== course.courseDiscount) {
            course.courseDiscount = courseDiscount;
        }
        // Save only if something was modified
        if (course.isModified()) {
            const updatedCourse = await course.save();
            return res.status(200).json({ message: "Course updated successfully", course: updatedCourse });
        }

        return res.status(200).json({ message: "No changes made to the course" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error updating course" });
    }
});


// add subject to course
app.post('/addSubjectToCourse', async (req, res) => {
    const { subjectName, courseId } = req.body;

    const course = await Course.findById(courseId);

    const newSubject = new Subject({
        subjectName
    });

    const savedSubject = await newSubject.save();

    course.courseSubjects.push({ subjectName: savedSubject.subjectName, _id: savedSubject._id });

    course.save().then(course => {
        res.json({ message: "success", course }).status(200);
    }).catch(err => {
        res.json({ error: "Error in adding subject to course" }).status(500);
        console.log(err);
    });

});

// delete subject from course
app.post('/deleteSubjectFromCourse', async (req, res) => {
    // subjectId, courseId
    const { subjectId, courseId } = req.body;
    const subject = await Subject.findById(subjectId);

    if (!subject) {
        return res.status(404).json({ message: 'Subject not found' });
    }

    // Remove the subject from the Subject collection
    await Subject.findByIdAndDelete(subjectId);
    const course = await Course.findById(courseId);

    const updatedSubjects = course.courseSubjects.filter(subject => subject._id != subjectId);

    course.courseSubjects = updatedSubjects;

    course.save().then(course => {
        res.json({ message: "success", course }).status(200);
    }
    ).catch(err => {
        res.json({ error: "Error in deleting subject from course" }).status(500);
        console.log(err);
    }
    );
});


// chapter to subject
app.post('/addChapterToSubject', async (req, res) => {
    // chapterName, subjectId
    const { chapterName, subjectId } = req.body;
    const subject = await Subject.findById(subjectId);

    const newChapter = new Chapter({
        chapterName,
        subjectId,
    });

    const savedChapter = await newChapter.save();

    subject.subjectChapters.push({ chapterName: savedChapter.chapterName, _id: savedChapter._id });

    subject.save().then(subject => {
        res.json({ message: "success", subject }).status(200);
    }).catch(err => {
        res.json({ error: "Error in adding chapter to subject" }).status(500);
        console.log(err);
    });

});

app.post('/deleteChapterFromSubject', async (req, res) => {
    const { chapterId, subjectId } = req.body;

    try {
        // Find the subject
        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Remove the chapter from the subject's subjectChapters array
        const updatedChapters = subject.subjectChapters.filter(chapter => chapter._id.toString() !== chapterId);

        // Update the subject's chapters
        subject.subjectChapters = updatedChapters;

        await subject.save();

        // Now delete the chapter itself from the Chapter collection
        await Chapter.findByIdAndDelete(chapterId);

        res.status(200).json({ message: 'Chapter deleted successfully from subject and database',subject });
    } catch (error) {
        console.error('Error deleting chapter:', error);
        res.status(500).json({ message: 'Error deleting chapter', error });
    }
});

app.post('/getSubjectBySubjectId', async (req, res) => {
    const { subjectId } = req.body;
    const subject = await Subject.findById(subjectId);
    res.json({ subject, message: "success" }).status(200);

});



app.post('/updateSubjectById', async (req, res) => {
    const { _id, subjectName } = req.body;

    const subject = await Subject.findById(_id);

    subject.subjectName = subjectName;

    subject.save().then(subject => {
        res.json({ message: "success", subject }).status(200);
    }
    ).catch(err => {
        res.json({ error: "Error in updating subject" }).status(500);
        console.log(err);
    }
    );
});

app.post('/getChaptersAndQuizesBySubjectId', async (req, res) => {
    const { subjectId } = req.body;
    const subject = await Subject.findById(subjectId);
    res.json({ subject, message: "success" }).status(200);

});


// delete chapter from subject
app.post('/deleteChapterFromSubject', async (req, res) => {
    const { chapterId, subjectId } = req.body;

    const subject = await Subject.findById(subjectId);
    const updatedChapters = subject.subjectChapters.filter(chapter => chapter._id != chapterId);

    subject.subjectChapters = updatedChapters;

    subject.save().then(subject => {
        res.json({ message: "success", subject }).status(200);
    }).catch(err => {
        res.json({ error: "Error in deleting chapter from subject" }).status(500);
        console.log(err);
    });

});



// upload intro video to course
app.post('/uploadIntroVideoToCourse', async (req, res) => {
    const { courseId, introVideo } = req.body;

    const course = await Course.findById(courseId);

    course.introVideo = introVideo;

    course.save().then(course => {
        res.json({ message: "success", course }).status(200);
    }).catch(err => {
        res.json({ error: "Error in uploading intro video to course" }).status(500);
        console.log(err);
    });

});


module.exports = app;
