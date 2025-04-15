const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Course = mongoose.model('Course');
const Subject = mongoose.model('Subject');
const Chapter = mongoose.model('Chapter');

const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');


app.post('/getChapterById', async (req, res) => {
    const { chapterId } = req.body;
    const chapter = await Chapter.findById(chapterId);
    // console.log(chapter);
    res.json({ chapter, message: "success" }).status(200);
});

// add video to chapter
app.post('/addVideoToChapter', async (req, res) => {
    const { chapterId, videoUrl, videoName, access } = req.body;
    const chapter = await Chapter.findById(chapterId);
    chapter.chapterVideos.push({
        videoUrl,
        videoName,
        access
    });
    chapter.save().then(chapter => {
        res.json({ message: "success", chapter }).status(200);
    }).catch(err => {
        res.json({ error: "Error in adding video" }).status(500);
        console.log(err);
    });
});

// delete video from chapter
app.post('/deleteVideoFromChapter', async (req, res) => {
    const { chapterId, videoUrl, videoName } = req.body;
    const chapter = await Chapter.findById(chapterId);
    let updatedVideos = chapter.chapterVideos.filter((video) => {
        return !(video.videoUrl === videoUrl && video.videoName === videoName);
    });

    chapter.chapterVideos = updatedVideos;

    chapter.save().then(chapter => {
        res.json({ message: "success", chapter }).status(200);
    }).catch(err => {
        res.json({ error: "Error in deleting video" }).status(500);
        console.log(err);
    });
});

// add notes to chapter
app.post('/addNotesToChapter', async (req, res) => {
    const { chapterId, notesUrl, notesName, access } = req.body;
    const chapter = await Chapter.findById(chapterId);
    chapter.chapterNotes.push({
        notesUrl,
        notesName,
        access
    });

    console.log(chapter.chapterNotes);
    chapter.save().then(chapter => {
        res.json({ message: "success", chapter }).status(200);
    }).catch(err => {
        res.json({ error: "Error in adding notes" }).status(500);
        console.log(err);
    });
});

// delete notes from chapter
app.post('/deletenotesFromChapter', async (req, res) => {
    const { chapterId, notesUrl, notesName } = req.body;
    const chapter = await Chapter.findById(chapterId);

    let updatedNotes = chapter.chapterNotes.filter((notes) => {
        return !(notes.notesUrl === notesUrl && notes.notesName === notesName);
    });

    chapter.chapterNotes = updatedNotes;

    chapter.save().then(chapter => {
        res.json({ message: "success", chapter }).status(200);
    }).catch(err => {
        res.json({ error: "Error in deleting notes" }).status(500);
        console.log(err);
    });
});



app.post('/updateChapterById', async (req, res) => {
    const { _id, chapterName, chapterDescription, chapterImage } = req.body;

    // Find the chapter
    const chapter = await Chapter.findById(_id);
    if (!chapter) {
        return res.status(404).json({ error: "Chapter not found" });
    }

    // Update chapter details
    chapter.chapterName = chapterName;
    chapter.chapterDescription = chapterDescription;
    chapter.chapterImage = chapterImage;
    await chapter.save();

    // Find the corresponding subject
    const subject = await Subject.findById(chapter.subjectId);
    if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
    }

    // Update the chapterName in subject.subjectChapters array
    subject.subjectChapters = subject.subjectChapters.map(chap =>
        chap._id.toString() === _id ? { ...chap, chapterName } : chap
    );

    await subject.save();
    console.log(chapter, subject)
    res.status(200).json({ message: "success", chapter, subject });
});

module.exports = app;