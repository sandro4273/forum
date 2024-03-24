// TODO: Maybe make a class for the post too
// TODO: File is a mess
// TODO: change editPost to toggleEditPost

// Global variables

let currentUserId = null;
let currentUsername = null;
let currentUserRole = null;

let authorId = null;
let authorUsername = null;

let post = null;
let postId = null;

let editPostVisible = false;

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

    // If the user is the author create edit post editor
    if (currentUserId && currentUsername === authorUsername){
        postQuill = new Quill('#editPostEditor', quillSettingsPost);
    }

    // Post Management Buttons
    const container = document.getElementById('postManagementButtonsContainer');
    const authorRole = await getRole(authorId);
    const postManagementButtons = getContentManagementButtons(currentUserRole, authorRole, currentUserId === authorId);
    container.appendChild(postManagementButtons);

    // Add event listeners to the post management buttons if they exist
    const editButton = postManagementButtons.querySelector(".editContentButton");
    const submitEditButton = postManagementButtons.querySelector(".submitEditContentButton");
    const deleteButton = postManagementButtons.querySelector(".deleteContentButton");

    editButton && editButton.addEventListener("click", () => toggleEditPost(postId));
    submitEditButton && submitEditButton.addEventListener("click", () => submitEditPostFunction(postId));
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

        // Insert comment into HTML
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

async function toggleEditPost(post_id){
    editPostVisible = !editPostVisible;
    // Get the post content
    const postContent = post["content"];

    // Toggle the post content
    const postContentElement = document.querySelector("#postContent");
    postContentElement.style.display = editPostVisible ? "none" : "block";

    // Toggle text editor with the post content
    const editPostDiv = document.querySelector("#editPost");
    editPostDiv.style.display = editPostVisible ? "block" : "none";
    postQuill.root.innerHTML = postContent;

    // Toggle text of "bearbeiten" button
    const editPostButton = document.querySelector("#postManagementButtonsContainer").querySelector(".editContentButton");
    if(editPostButton){
        editPostButton.textContent = editPostVisible ? "Zurück" : "Bearbeiten";
    }
    
    // Toggle submit button
    const submitEditPost = document.querySelector("#postManagementButtonsContainer").querySelector(".submitEditContentButton");
    submitEditPost.style.display = editPostVisible ? "inline-block" : "none";
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
        // Content Management Buttons
        this.contentManagementButtons = getContentManagementButtons(currentUserRole, this.authorRole, this.isAuthor);
        this.commentContainer.appendChild(this.contentManagementButtons);

        // Add event listeners to the content management buttons if they exist
        const editButton = this.contentManagementButtons.querySelector(".editContentButton");
        const submitEditButton = this.contentManagementButtons.querySelector(".submitEditContentButton");
        const deleteButton = this.contentManagementButtons.querySelector(".deleteContentButton");

        editButton && editButton.addEventListener("click", () => this.toggleEditComment());
        submitEditButton && submitEditButton.addEventListener("click", () => this.submitEditComment());
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
    }

    toggleEditComment(){
        this.editCommentVisible = !this.editCommentVisible;
        // Toggle the comment content
        this.commentContainer.querySelector("#commentContent").style.display = this.editCommentVisible ? "none" : "inline-block";

        // Toggle the editor
        this.editorContainer.style.display = this.editCommentVisible ? "block" : "none";
        this.quillToolbar.container.style.display = this.editCommentVisible ? "block" : "none";
        this.quill.root.innerHTML = this.content;

        // Toggle the text of the edit button
        this.contentManagementButtons.querySelector(".editContentButton").textContent = this.editCommentVisible ? "Zurück" : "Bearbeiten";

        // Toggle the submit button
        this.contentManagementButtons.querySelector(".submitEditContentButton").style.display = this.editCommentVisible ? "inline-block" : "none";
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
