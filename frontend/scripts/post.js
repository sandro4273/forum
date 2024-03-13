async function onLoad(){
    // Load the post
    const postId = getPostIdFromUrl();
    const post = await getPost(postId);

    // Add event listeners
    document.querySelector("#submitComment").addEventListener("click", (event) => createComment(event, postId));
    document.querySelector("#editPostButton").addEventListener("click", () => editPost(postId));
    document.querySelector("#deletePostButton").addEventListener("click", () => deletePost(postId));

    await toggleSiteVisibility();
    await loadPost(post);
    await loadTags(postId);
    await loadComments(postId);
}

async function toggleSiteVisibility(){
    // Check if a user is logged in
    const currentUserId = await getCurrentUserId();
    if(!currentUserId) return;

    // Get the role and username of the current user
    const currentUsername = await getUsername(currentUserId);
    const currentUserRole = await getRole(currentUsername);

    // Get the author of the post
    const post = await getPost(getPostIdFromUrl());
    const authorId = post["user_id"];
    const authorUsername = await getUsername(authorId);

    // If a user is logged in, display the comment form
    const commentForm = document.getElementById('commentForm');
    commentForm.style.display = 'block';

    // If the user is an admin/moderator or the author, display the delete button
    const deletePostButton = document.getElementById('deletePostButton');
    if (currentUserRole === "admin" || currentUserRole === "moderator" || currentUsername === authorUsername){
        deletePostButton.style.display = 'inline-block';
    }

    // If the user is the author, display the edit button
    const editPostButton = document.getElementById('editPostButton');
    if (currentUsername === authorUsername){
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

    return response.ok ? id["user_id"] : null;
}

async function getPost(postId){
    const response = await fetch(BACKENDURL + `post/id/${postId}/`);
    const post = await response.json();
    return response.ok ? post["post"] : null;
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


async function loadPost(post){
    // load title and content
    const postTitle = post["title"];
    const postContent = post["content"];

    // load author and role
    const authorId = post["user_id"];
    const authorUsername = await getUsername(authorId);
    const authorRole = await getRole(authorUsername);
    const roleColor = getRoleColor(authorRole);
    
    // insert post into HTML
    document.querySelector("#postTitle").innerHTML = `${postTitle}  ---  ${authorUsername} <span style="color: ${roleColor}">(${authorRole})</span>`;
    document.querySelector("#postContent").textContent = postContent;
}

async function loadTags(postId){
    // load tags
    const response = await fetch(BACKENDURL + "post/id/" + postId + "/tags/all/");
    const tagsData = await response.json();
    const tags = tagsData["tags"];


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

async function loadComments(postId){
    // load comments
    const response = await fetch(BACKENDURL + "post/id/" + postId + "/comments/all/");
    const commentsData = await response.json();
    const comments = commentsData["comments"];

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


async function createComment(event, postId){
    event.preventDefault();

    // Extract content from form
    const content = document.forms["createComment"]["commentContent"].value;

    const body = {
        "content": content
    }

    // Create comment
    const auth_token = localStorage.getItem("AuthToken");

    const create_comment_response = await fetch(
        BACKENDURL + "post/id/" + postId + "/create_comment/", {
            method: "POST", 
            headers: {
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${auth_token}`
            },
            body: JSON.stringify(body),
        });

    // Reload comments
    await loadComments(postId);

    // Clear comment form
    document.forms["createComment"]["commentContent"].value = "";

    return await create_comment_response.json();
}


async function editPost(post_id){
    // Get the post content
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/");
    const post = await response.json();
    const postContent = post["post"]["content"];

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
    
    await response.json();

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