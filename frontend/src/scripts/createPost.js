/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file createPost.js
 * This file contains the logic for the create post page. It allows users to create a new post.
 * It uses the Quill Rich Text Editor to create and edit posts.
 *
 * The Quill Rich Text Editor is a third-party library that allows users to create and edit rich text.
 * (https://quilljs.com/)
 */

// Rich Text Editor
const quill = new Quill('#postContentEditor', quillSettingsPost);

/**
* Handles the post form submission. Sends a POST request to the backend with the post form data.
*/
async function submitPostForm(){
    // Extract text and title from form
    const post_title = document.forms["createPost"]["postTitle"].value;
    const post_content = quill.root.innerHTML;

    const body= {
        "title": post_title,
        "content": post_content
    };

    // Create post and retrieve the post_id from the backend
    const auth_token = localStorage.getItem("AuthToken");
    const create_post_response = await fetch(
        `${BACKENDURL}posts/create_post/`, {
            method: "POST", 
            headers: {
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${auth_token}`
            },
            body: JSON.stringify(body),
        });

    // If the post creation was not successful, display an error message
    if (!create_post_response.ok){
        document.getElementById("errorMessage").style.display = "block";
        return;
    }

    // If the post creation was successful, redirect to the post page
    const post_data = await create_post_response.json();
    const post_id = post_data["post_id"];
    window.location.href = "/frontend/public/post.html?id=" + post_id;
}

/**
 * Initializes the create post page. Displays the current user and adds an event listener to the submit button.
 */
async function initialize(){
    // Display the current user
    await displayAuthStatus();

    // Add event listener to the submit button
    document.querySelector("#submitButton").addEventListener("click", submitPostForm);
}


// Entry point - Execute initialize() when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", initialize);
