// Funktion wird ausgeführt wenn Seite geladen ist

// Global variables
let currentUserId = null;
let currentUsername = null;
let currentUserRole = null;

let authorId = null;
let authorUsername = null;

let post = null;

async function onLoad(){
    let postId = getPostIdFromUrl();
    // Load user data
    currentUserId = await getCurrentUserId();
    if(currentUserId){
        currentUsername = await getUsername(currentUserId);
        currentUserRole = await getRole(currentUsername);
    }
    // Load post data
    post = await getPost(postId);
    authorId = post["result"]["user_id"];
    authorUsername = await getUsername(authorId);

    document.querySelector("#submitComment").addEventListener("click", (event) => createComment(event, postId));
    document.querySelector("#editPostButton").addEventListener("click", () => editPost(postId));
    document.querySelector("#deletePostButton").addEventListener("click", () => deletePost(postId));

    await toggleSiteVisibility();
    await loadPost(postId);
    await loadTags(postId);
    await loadComments(postId);
}

async function toggleSiteVisibility(){
    // If a user is logged in, display the comment form
    const commentForm = document.getElementById('commentForm');
    commentForm.style.display = currentUserId ? 'block' : 'none';

    // If the user is an admin/moderator or the author, display the delete button
    const deletePostButton = document.getElementById('deletePostButton');
    if (currentUserId && (currentUserRole === "admin" || currentUserRole === "moderator" || currentUsername === authorUsername)){
        deletePostButton.style.display = 'inline-block';
    }

    // If the user is the author, display the edit button
    const editPostButton = document.getElementById('editPostButton');
    if (currentUserId && currentUsername === authorUsername){
        editPostButton.style.display = 'inline-block';
    }
}

async function getCurrentUserId(){
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `get_current_user_id/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`
        }
    });
    const id = await response.json();
    console.log(id)

    return response.ok ? id : null;
}

async function getPost(postId){
    const response = await fetch(BACKENDURL + `post/id/${postId}/`);
    const post = await response.json();
    return response.ok ? post : null;
}

async function getUsername(userId){
    const response = await fetch(BACKENDURL + `user/id/${userId}/username/`);
    const username = await response.json();
    return response.ok ? username["username"] : null;
}

// Extract the post ID from the URL
function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}


async function loadPost(post_id){
    // load title and content
    const postTitle = post["result"]["title"];
    const postContent = post["result"]["content"];

    // load author and role
    const authorRole = await getRole(authorUsername);
    const roleColor = getRoleColor(authorRole);
    
    // insert post into HTML
    document.querySelector("#postTitle").innerHTML = `${postTitle}  ---  ${authorUsername} <span style="color: ${roleColor}">(${authorRole})</span>`;
    document.querySelector("#postContent").textContent = postContent;
}

async function loadTags(post_id){
    // load tags
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/tags/all/");
    const tagsData = await response.json();
    const tags = tagsData["result"];

    // Check if there are any tags
    document.querySelector("#tags").style.display = tags.length > 0 ? "block" : "none";
    // Create HTML elements for each tag
    const tagList = document.querySelector("#tags");

    for(let i = 0; i < tags.length; i++){
        const tag = tags[i];
        const tagElement = document.createElement('span');
        tagElement.textContent = tag["tag_name"] + "  |  ";
        tagList.appendChild(tagElement);
    }
}

async function loadComments(post_id){
    // load comments
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/comments/all/");
    const commentsData = await response.json();
    const comments = commentsData["result"];

    // Create HTML elements for each comment
    const commentList = document.querySelector("#commentList");
    commentList.innerHTML = ""; // Clear the comment list

    for(let i = 0; i < comments.length; i++){
        const comment = comments[i];

        // Get username of the user who created the comment
        const usernameResponse = await fetch(BACKENDURL + "user/id/" + comment["user_id"] + "/username/");
        const usernameData = await usernameResponse.json();
        const username = usernameData["username"];

        // Get role of the user who created the comment
        const userRole = await getRole(username);
        const roleColor = getRoleColor(userRole);

        // Create a container for the comment
        const commentContainer = document.createElement('div');

        // Create "See more" button that displays edit and delete buttons
        const editButton = document.createElement('button');
        editButton.textContent = "Edit";
        editButton.style.display = "none";
        commentContainer.appendChild(editButton);
        editButton.addEventListener("click", () => editComment(comment["comment_id"], post_id));

        const deleteButton = document.createElement('button');
        deleteButton.textContent = "Delete";
        deleteButton.style.display = "none";
        commentContainer.appendChild(deleteButton);
        deleteButton.addEventListener("click", () => deleteComment(comment["comment_id"], post_id));

        const seeMoreButton = document.createElement('button');
        let seeMoreButtonVisible = false;
        seeMoreButton.textContent = "...";
        // Display the "See more" button if the user is an admin, moderator or the author of the comment
        if (currentUserId && (currentUserRole === "admin" || currentUserRole === "moderator" || currentUsername === username)){
            seeMoreButton.style.display = "inline-block";
            console.log(currentUsername, username, currentUserId, comment["user_id"])
        }
        // Toggle the visibility of the edit and delete buttons if the "See more" button is clicked
        seeMoreButton.addEventListener("click", () => {
            seeMoreButtonVisible = !seeMoreButtonVisible; 
            editButton.style.display = seeMoreButtonVisible ? "inline-block" : "none"; 
            deleteButton.style.display = seeMoreButtonVisible ? "inline-block" : "none";});
        commentContainer.appendChild(seeMoreButton);


        // Display creation time (in gray)
        const creationTimeElement = document.createElement('span');
        creationTimeElement.textContent = comment["created_at"];
        creationTimeElement.style.color = "gray";
        commentContainer.appendChild(creationTimeElement);

        // Display user ID and role
        const userIDElement = document.createElement('span');
        userIDElement.textContent = " - " + username;
        commentContainer.appendChild(userIDElement);
        const roleElement = document.createElement('span');

        roleElement.textContent = ` (${userRole}): `;
        roleElement.style.color = roleColor;
        commentContainer.appendChild(roleElement);

        // Display comment content
        const commentContentElement = document.createElement('span');
        commentContentElement.textContent = comment["content"];
        commentContainer.appendChild(commentContentElement);

        // Append the comment container to the comment list
        commentList.appendChild(commentContainer);
    }
}


async function createComment(event, post_id){
    event.preventDefault();

    // Extract content from form
    const content = document.forms["createComment"]["commentContent"].value;

    const body = {
        "content": content
    }

    // Create comment
    const auth_token = localStorage.getItem("AuthToken");

    const create_comment_response = await fetch(
        BACKENDURL + "post/id/" + post_id + "/create_comment/", {
            method: "POST", 
            headers: {
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${auth_token}`
            },
            body: JSON.stringify(body),
        });

    // Reload comments
    await loadComments(post_id);

    // Clear comment form
    document.forms["createComment"]["commentContent"].value = "";

    return await create_comment_response.json();
}


async function editPost(post_id){
    // Get the post content
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/");
    const post = await response.json();
    const postContent = post["result"]["content"];

    // Hide the post content and button
    const postContentElement = document.querySelector("#postContent");
    postContentElement.setAttribute("style", "display: none;");
    const editPostButton = document.querySelector("#editPostButton");
    editPostButton.setAttribute("style", "display: none;");

    // Show input field with the post content
    const editPostDiv = document.querySelector("#editPost");
    console.log(editPostDiv)
    editPostDiv.style.display = "block";
    const editPostInput = document.querySelector("#editPostInput");
    editPostInput.value = postContent;
    editPostInput.setAttribute("style", "show: block;");
    
    // Add event listener to the submit button
    const submitEditPost= document.querySelector("#submitEditPost");
    submitEditPost.addEventListener("click", () => submitEditPostFunction(post_id));
}

async function submitEditPostFunction(post_id){
    // Get the new post content
    const newPostContent = document.querySelector("#editPostInput").value;

    // Send the new post content to the backend
    const auth_token = localStorage.getItem("AuthToken");
    console.log(newPostContent);
    const response = await fetch(
        BACKENDURL + "post/id/" + post_id + "/edit/", {
            method: "PUT",
            headers: {
                //"Content-Type" : "application/json",
                "Authorization": `Bearer ${auth_token}`
            },
            body: newPostContent,
        });
    

    // Reload the site
    location.reload();
}

async function deletePost(post_id){
    // Send the delete request
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "post/id/" + post_id + "/delete/", {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            },
        });

    // Redirect to the index page, but only if the request was successful
    if(response.ok){
        window.location.href = "/frontend/index.html";
    }
}

// execute onLoad when page is loaded
window.addEventListener("DOMContentLoaded", onLoad());