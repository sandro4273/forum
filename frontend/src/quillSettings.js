/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file quillSettings.js
 * This file contains settings for the Quill editor. (https://quilljs.com/)
 */

const quillSettingsPost = {
    modules: {
        toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            ['link'],
            ['clean']
        ]
    },
    theme: 'snow'
}

const quillSettingsComment = {
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            ['link'],
            ['clean']
        ]
    },
    theme: 'snow'
}