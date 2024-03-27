/**
* Handles the post form submission. Sends a POST request to the backend with the post form data.
*/

// Rich Text Editor
const quill = new Quill('#postContentEditor', quillSettingsPost);

/**
 * Executed when the DOM is fully loaded. Adds an event listener to the submit button of the post form.
 */
function onLoad(){
    // Display the current user
    showCurrentUser();
    // Add event listener to the submit button
    document.querySelector("#submitButton").addEventListener("click", submitPostForm);
}

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


// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());
