// TODO: Maybe make a class for the post too
// Global variables
let currentUserId = null;
let currentUsername = null;
let currentUserRole = null;

let authorId = null;
let authorUsername = null;

let post = null;

// Funktion wird ausgeführt wenn Seite geladen ist
async function onLoad(){
    let postId = getPostIdFromUrl();

    // Load user data
    currentUserId = await getCurrentUserId();
    if(currentUserId){
        currentUsername = await getUsername(currentUserId);
        currentUserRole = await getRole(currentUsername);
    }
    console.log(currentUsername)
    // Load post data
    post = await getPost(postId);
    authorId = post["user_id"];
    authorUsername = await getUsername(authorId);

    document.querySelector("#submitComment").addEventListener("click", (event) => createComment(event, postId));
    document.querySelector("#editPostButton").addEventListener("click", () => editPost(postId));
    document.querySelector("#deletePostButton").addEventListener("click", () => deletePost(postId));

    await toggleSiteVisibility();
    await loadPost();
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

    return response.ok ? id["user_id"] : null;
}

async function getPost(postId){
    const response = await fetch(BACKENDURL + `posts/id/${postId}/`);
    const post = await response.json();
    return response.ok ? post["post"] : null;
}

async function getUsername(userId){
    const response = await fetch(BACKENDURL + `users/id/${userId}/username/`);
    const username = await response.json();
    return response.ok ? username["username"] : null;
}

// Extract the post ID from the URL
function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}


async function loadPost(){
    // load title and content
    const postTitle = post["title"];
    const postContent = post["content"];

    // load author and role
    const authorRole = await getRole(authorUsername);
    const roleColor = getRoleColor(authorRole);
    
    // insert post into HTML
    document.querySelector("#postTitle").innerHTML = `${postTitle}  ---  ${authorUsername} <span style="color: ${roleColor}">(${authorRole})</span>`;
    document.querySelector("#postContent").textContent = postContent;
}

async function loadTags(post_id){
    // load tags
    const response = await fetch(BACKENDURL + "posts/id/" + post_id + "/tags/all/");
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

async function loadComments(post_id){
    // load comments
    const response = await fetch(BACKENDURL + "posts/id/" + post_id + "/comments/all/");
    const commentsData = await response.json();
    const comments = commentsData["comments"];

    // Create Comment objects for each comment
    let commentObjects = [];
    for(let i = 0; i < comments.length; i++){
        // Create comment object
        const comment = comments[i];
        const commentObject = new Comment();
        await commentObject.init(comment["comment_id"], comment["content"], comment["user_id"], comment["post_id"], comment["created_at"]);
        commentObjects.push(commentObject);

        // Toggle visibility of see more button
        if(currentUserId && (currentUserRole === "admin" || currentUserRole === "moderator" || currentUserId === comment["user_id"])){
            commentObject.seeMoreButton.style.display = "inline-block";
            console.log("visible")
        }
        // Append
        document.querySelector("#commentList").appendChild(commentObject.commentContainer);
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
        BACKENDURL + "posts/id/" + post_id + "/create_comment/", {
            method: "POST", 
            headers: {
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${auth_token}`
            },
            body: JSON.stringify(body),
        });

    // reload the site
    location.reload();
}


async function editPost(post_id){
    // Get the post content
    const response = await fetch(BACKENDURL + "posts/id/" + post_id + "/");
    const postData = await response.json();
    const postContent = postData["post"]["content"];

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
        BACKENDURL + "posts/id/" + post_id + "/edit/", {
            method: "PUT",
            headers: {
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
        BACKENDURL + "posts/id/" + post_id + "/delete/", {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            },
        });

    // Redirect to the index page, but only if the request was successful
    if(response.ok){
        window.location.href = "/frontend/public/index.html";
    }
}

class Comment {
    async init(commentId, content, authorId, postId, createdAt){
        this.commentId = commentId;
        this.content = content;
        this.authorId = authorId;
        this.postId = postId;
        this.createdAt = createdAt;

        this.seeMoreVisible = false;
        this.editCommentVisible = false;

        this.commentContainer = document.createElement('div');
        await this.loadComment();
        this.loadButtons();
        this.loadEditElements();
    }

    async loadComment(){
        // Display creation time (in gray)
        const creationTimeElement = document.createElement('span');
        creationTimeElement.textContent = this.createdAt;
        creationTimeElement.style.color = "gray";
        this.commentContainer.appendChild(creationTimeElement);

        // Display author ID and role
        const userIDElement = document.createElement('span');
        userIDElement.textContent = " - " + await getUsername(this.authorId);
        this.commentContainer.appendChild(userIDElement);
        const roleElement = document.createElement('span');

        const authorRole = await getRole(await getUsername(this.authorId));
        roleElement.textContent = ` (${authorRole}): `;
        roleElement.style.color = getRoleColor(authorRole);
        this.commentContainer.appendChild(roleElement);

        // Display comment content
        const commentContentElement = document.createElement('span');
        commentContentElement.textContent = this.content;
        commentContentElement.id = "commentContent";
        this.commentContainer.appendChild(commentContentElement);
    }

    loadButtons(){
        // Create elements
        this.seeMoreButton = document.createElement('button');
        this.seeMoreButton.textContent = "...";
        this.seeMoreButton.style.display = this.seeMoreVisible ? "inline-block" : "none";

        this.editButton = document.createElement('button');
        this.editButton.textContent = "Edit";
        this.editButton.style.display = "none";

        this.deleteButton = document.createElement('button');
        this.deleteButton.textContent = "Delete";
        this.deleteButton.style.display = "none";

        // Insert elements
        this.commentContainer.prepend(this.deleteButton);
        this.commentContainer.prepend(this.editButton);
        this.commentContainer.prepend(this.seeMoreButton);

        // Add event listeners
        this.seeMoreButton.addEventListener("click", () => this.toggleButtons());
        this.editButton.addEventListener("click", () => this.toggleEditComment());
        this.deleteButton.addEventListener("click", () => this.deleteComment());
    }

    loadEditElements(){
        // Create elements
        this.editInput = document.createElement('input');
        this.editInput.style.display = "none";

        this.submitEdit = document.createElement('button');
        this.submitEdit.textContent = "Senden";
        this.submitEdit.style.display = "none";

        // Insert elements
        this.commentContainer.appendChild(this.editInput);
        this.commentContainer.appendChild(this.submitEdit);

        // Add event listeners
        this.submitEdit.addEventListener("click", () => this.submitEditComment());
    }

    toggleButtons(){
        this.seeMoreVisible = !this.seeMoreVisible;
        // Toggle delete button
        this.deleteButton.style.display = this.seeMoreVisible ? "inline-block" : "none";
        // Only show the edit button if the user is the author of the comment
        if (this.authorId === currentUserId){
            this.editButton.style.display = this.seeMoreVisible ? "inline-block" : "none";
        }
    }

    toggleEditComment(){
        this.editCommentVisible = !this.editCommentVisible;
        // Toggle the comment content and buttons of the current comment
        this.commentContainer.querySelector("#commentContent").style.display = this.editCommentVisible ? "none" : "inline-block";
        this.editButton.textContent = this.editCommentVisible ? "Zurück" : "Edit";

        // Toggle input field with the comment content
        this.editInput.style.display = this.editCommentVisible ? "inline-block" : "none";
        this.editInput.value = this.content;

        // Toggle submit button
        this.submitEdit.style.display = this.editCommentVisible ? "inline-block" : "none";

    }

    async submitEditComment(){
        // Get the new comment content
        const newCommentContent = this.editInput.value;

        // Send the new comment content to the backend
        const auth_token = localStorage.getItem("AuthToken");
        const response = fetch(
            BACKENDURL + "comments/id/" + this.commentId + "/edit/", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${auth_token}`
                },
                body: newCommentContent,
            });
        
        // Reload the site
        location.reload();
    }

    deleteComment(){
        // Send the delete request
        const auth_token = localStorage.getItem("AuthToken");
        const response = fetch(
            BACKENDURL + "comments/id/" + this.commentId + "/delete/", {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${auth_token}`
                },
            });

        // Reload the site
        location.reload();
    }

}
// execute onLoad when page is loaded
window.addEventListener("DOMContentLoaded", onLoad());