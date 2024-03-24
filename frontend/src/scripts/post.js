// TODO: Maybe make a class for the post too
// TODO: File is a mess

// Global variables

let currentUserId = null;
let currentUsername = null;
let currentUserRole = null;

let authorId = null;
let authorUsername = null;

let post = null;
let postId = null;

// Rich Text Editor
const commentQuill = new Quill('#createCommentEditor', quillSettingsComment);
let postQuill = null;

// Funktion wird ausgeführt wenn Seite geladen ist
async function onLoad(){
    postId = getPostIdFromUrl();

    // Load user data
    currentUserId = await getCurrentUserId();
    if(currentUserId){
        currentUsername = await getUsername(currentUserId);
        currentUserRole = await getRole(currentUserId);
    }
    console.log("Logged in as: " + currentUsername)

    // Load post data
    post = await getPost(postId);
    authorId = post["author_id"];
    authorUsername = await getUsername(authorId);

    // Add event listeners
    document.querySelector("#upvoteButton").addEventListener("click", (event) => vote(event, postId, 1));
    document.querySelector("#downvoteButton").addEventListener("click", (event) => vote(event, postId, -1));

    document.querySelector("#submitComment").addEventListener("click", (event) => createComment(event, postId));
    document.querySelector("#editPostButton").addEventListener("click", () => editPost(postId));
    document.querySelector("#deletePostButton").addEventListener("click", () => deletePost(postId));

    // Load post, tags and comments
    await toggleSiteVisibility();
    await loadPost();
    await loadTags(postId);
    await loadVotes(postId);
    await loadComments(postId);
}

async function toggleSiteVisibility(){
    // If a user is logged in, display the comment form and vote buttons
    const commentForm = document.getElementById('commentForm');
    commentForm.style.display = currentUserId ? 'block' : 'none';

    const upvoteButton = document.getElementById('upvoteButton');
    const downvoteButton = document.getElementById('downvoteButton');
    upvoteButton.style.display = currentUserId ? 'inline-block' : 'none';  
    downvoteButton.style.display = currentUserId ? 'inline-block' : 'none';

    // If the user is an admin/moderator or the author, display the delete button
    const deletePostButton = document.getElementById('deletePostButton');
    if (currentUserId && (currentUserRole === "admin" || currentUserRole === "moderator" || currentUsername === authorUsername)){
        deletePostButton.style.display = 'inline-block';
    }

    // If the user is the author, display the edit button and create edit post editor
    const editPostButton = document.getElementById('editPostButton');
    if (currentUserId && currentUsername === authorUsername){
        editPostButton.style.display = 'inline-block';
        postQuill = new Quill('#editPostEditor', quillSettingsPost);
    }

    // Post Management Buttons
    const container = document.getElementById('postManagementButtonsContainer');
    const authorRole = await getRole(authorId);
    const postManagementButtons = getContentManagementButtons(currentUserRole, authorRole, currentUserId === authorId);
    container.appendChild(postManagementButtons);

    // Add event listeners to the post management buttons if they exist
    const editButton = postManagementButtons.querySelector(".editContentButton");
    const deleteButton = postManagementButtons.querySelector(".deleteContentButton");

    editButton && editButton.addEventListener("click", () => editPost(postId));
    deleteButton && deleteButton.addEventListener("click", () => deletePost(postId));
}

async function getCurrentUserId(){
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `users/me/?fields=user_id`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`
        }
    });
    const data = await response.json();

    return response.ok ? data["user"]["user_id"] : null;
}

async function getPost(postId){
    const response = await fetch(BACKENDURL + `posts/id/${postId}/`);
    const data = await response.json();
    return response.ok ? data["post"] : null;
}

async function getUsername(userId){
    const response = await fetch(BACKENDURL + `users/id/${userId}/?field=username`);
    const data = await response.json();
    return response.ok ? data["user"]["username"] : null;
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
    const authorRole = await getRole(authorId);
    const roleColor = getRoleColor(authorRole);
    
    // insert post into HTML
    document.querySelector("#postTitle").innerHTML = `${postTitle}  ---  ${authorUsername} <span style="color: ${roleColor}">(${authorRole})</span>`;
    document.querySelector("#postContent").innerHTML = postContent;
}

async function loadTags(post_id){
    // load tags
    const response = await fetch(BACKENDURL + "posts/id/" + post_id + "/tags/");
    const tagsData = await response.json();
    const tags = tagsData["tags"];

    // Check if there are any tags
    document.querySelector("#tags").style.display = tags.length > 0 ? "block" : "none";
    // Create HTML elements for each tag
    const tagList = document.querySelector("#tags");

    for(let i = 0; i < tags.length; i++){
        const tagElement = document.createElement('span');
        tagElement.textContent = tags[i] + "  |  ";
        tagList.appendChild(tagElement);
    }
}

async function loadVotes(postId){
    // load votes
    const response = await fetch(BACKENDURL + "posts/id/" + postId + "/votes/");
    const votes = await response.json() || 0;

    // Display votes
    const voteCount = document.querySelector("#voteCount");
    voteCount.textContent = votes;

    // Vote of current user
    if(currentUserId){
        const vote = await getVoteOfCurrent(postId);
        if(vote){
            if(vote === 1){
                document.querySelector("#upvoteButton").style.backgroundColor = "green";
            } else if(vote === -1){
                document.querySelector("#downvoteButton").style.backgroundColor = "red";
            }
        }
    }
}

async function loadComments(post_id){
    // load comments
    const response = await fetch(BACKENDURL + "posts/id/" + post_id + "/comments/");
    const commentsData = await response.json();
    const comments = commentsData["comments"];

    // Create Comment objects for each comment
    let commentObjects = [];
    for(let i = 0; i < comments.length; i++){
        // Create comment object
        const comment = comments[i];
        const commentObject = new Comment();
        await commentObject.init(comment["comment_id"], comment["content"], comment["author_id"], comment["post_id"], comment["created_at"]);
        commentObjects.push(commentObject);

        // Toggle visibility of see more button
        if(currentUserId && (currentUserRole === "admin" || currentUserRole === "moderator" || currentUserId === comment["user_id"])){
            commentObject.seeMoreButton.style.display = "inline-block";
        }
        // Append
        document.querySelector("#commentList").appendChild(commentObject.commentContainer);
    }
}

async function createComment(event, post_id){
    event.preventDefault();

    // Extract content from form
    const content = commentQuill.root.innerHTML;

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

    // Show text editor with the post content
    const editPostDiv = document.querySelector("#editPost");
    editPostDiv.style.display = "block";
    postQuill.root.innerHTML = postContent;
    
    // Add event listener to the submit button
    const submitEditPost= document.querySelector("#submitEditPost");
    submitEditPost.addEventListener("click", () => submitEditPostFunction(post_id));
}

async function submitEditPostFunction(post_id){
    // Get the new post content
    const newPostContent = postQuill.root.innerHTML;

    // Send the new post content to the backend
    const auth_token = localStorage.getItem("AuthToken");

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

async function vote(event, postId, vote){
    // Prevent the site from reloading
    event.preventDefault(); // WHY DOES THIS NOT WORK?

    // Send the vote request
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "posts/id/" + postId + "/vote/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            },
            body: vote,
        });
}

async function getVoteOfCurrent(postId){
    // Send the GET request, send auth token
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "posts/id/" + postId + "/votes/user/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            }
        });
    const vote = await response.json();
    return response.ok ? vote : null;
}

class Comment {
    async init(commentId, content, authorId, postId, createdAt){
        this.commentId = commentId;
        this.content = content;
        this.authorId = authorId;
        this.authorRole = await getRole(authorId);
        this.postId = postId;
        this.isAuthor = authorId === currentUserId;
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

        const authorRole = await getRole(this.authorId);
        roleElement.textContent = ` (${authorRole}): `;
        roleElement.style.color = getRoleColor(authorRole);
        this.commentContainer.appendChild(roleElement);

        // Display comment content
        const commentContentElement = document.createElement('span');
        commentContentElement.innerHTML = this.content;
        commentContentElement.id = "commentContent";
        commentContentElement.style.display = "inline-block";
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

        // Content Management Buttons
        const contentManagementButtons = getContentManagementButtons(currentUserRole, this.authorRole, this.isAuthor);
        this.commentContainer.appendChild(contentManagementButtons);
        // Add event listeners to the content management buttons if they exist
        const editButton = contentManagementButtons.querySelector(".editContentButton");
        const deleteButton = contentManagementButtons.querySelector(".deleteContentButton");

        editButton && editButton.addEventListener("click", () => this.toggleEditComment());
        deleteButton && deleteButton.addEventListener("click", () => this.deleteComment());

        // User Management Buttons
        const userManagementButtons = getUserManagementButtons(currentUserRole, this.authorRole);
        this.commentContainer.appendChild(userManagementButtons);

        // Add event listeners to the user management buttons if they exist
        const banButton = userManagementButtons.querySelector(".banButton");
        const promoteToModButton = userManagementButtons.querySelector(".promoteToModButton");
        const promoteToAdminButton = userManagementButtons.querySelector(".promoteToAdminButton");
        const demoteModButton = userManagementButtons.querySelector(".demoteModButton");
        const demoteAdminButton = userManagementButtons.querySelector(".demoteAdminButton");

        banButton && banButton.addEventListener("click", () => console.log("Ban user"));
        promoteToModButton && promoteToModButton.addEventListener("click", () => promoteToMod(this.authorId));
        promoteToAdminButton && promoteToAdminButton.addEventListener("click", () => promoteToAdmin(this.authorId));
        demoteModButton && demoteModButton.addEventListener("click", () => demoteMod(this.authorId));
        demoteAdminButton && demoteAdminButton.addEventListener("click", () => demoteAdmin(this.authorId));
    }

    loadEditElements(){
        // Create Rich Text Editor
        this.editorContainer = document.createElement('div');
        this.commentContainer.appendChild(this.editorContainer);
        this.quill = new Quill(this.editorContainer, quillSettingsComment);
        this.quillToolbar = this.quill.getModule('toolbar');
        // Hide it initially
        this.editorContainer.style.display = "none";
        this.quillToolbar.container.style.display = "none";

        // Create submit button
        this.submitEdit = document.createElement('button');
        this.submitEdit.textContent = "Senden";
        this.submitEdit.style.display = "none";

        // Insert elements
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

        this.editorContainer.style.display = this.editCommentVisible ? "block" : "none";
        this.quillToolbar.container.style.display = this.editCommentVisible ? "block" : "none";
        this.quill.root.innerHTML = this.content;

        // Toggle submit button
        this.submitEdit.style.display = this.editCommentVisible ? "inline-block" : "none";
    }

    async submitEditComment(){
        // Get the new comment content
        const newCommentContent = this.quill.root.innerHTML;

        // Send the new comment content to the backend
        const auth_token = localStorage.getItem("AuthToken");
        const response = await fetch(
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

    async deleteComment(){
        // Send the delete request
        const auth_token = localStorage.getItem("AuthToken");
        const response = await fetch(
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
