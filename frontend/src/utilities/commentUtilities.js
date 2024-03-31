/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file commentUtilities.js
 * This file contains utility functions for comments. It allows users to create, edit, and delete comments.
 * It also provides functions to get comments and create comment divs.
 */

/**
 * Create a comment
 * @param {Event} event
 * @param {number} post_id
 * @returns {Promise<void>}
 */
async function createComment(event, post_id, content){
    event.preventDefault();

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

/**
 * Get comments of a post
 * @param {number} post_id
 * @returns {Array}
 */
async function getComments(post_id){
    const response = await fetch(BACKENDURL + "posts/id/" + post_id + "/comments/");
    const commentsData = await response.json();
    return commentsData["comments"];
}

/**
 * Create a complete div element for a comment with all necessary elements
 * @param {Object} comment
 * @returns {HTMLDivElement}
 */
async function createCommentDiv(comment){
    // Main div element for the comment
    const commentDiv = document.createElement('div');

    // Variables of the comment
    commentDiv.dataset.commentId = comment["comment_id"];
    commentDiv.dataset.editCommentVisible = 'false';

    // Span element for the creation date
    const creationDateSpan = document.createElement('span');
    creationDateSpan.classList.add("commentCreationDate");
    creationDateSpan.textContent = comment["creation_date"];
    creationDateSpan.style.color = "gray";

    // Span element for the author
    const authorName = await getUsername(comment["author_id"]);

    const authorSpan = document.createElement('span');
    authorSpan.classList.add("commentAuthor");
    authorSpan.textContent = " - " + authorName;

    // Span element for the role
    const authorRole = await getRole(comment["author_id"]);

    const roleSpan = document.createElement('span');
    roleSpan.classList.add("authorRole");
    roleSpan.textContent = ` (${authorRole}): `;
    roleSpan.style.color = getRoleColor(authorRole);

    // Span element for the content
    const contentSpan = document.createElement('span');
    contentSpan.style.display = "inline-block";
    contentSpan.classList.add("commentContent");
    contentSpan.innerHTML = comment["content"];
    
    // Append all elements to the comment div
    commentDiv.appendChild(creationDateSpan);
    commentDiv.appendChild(authorSpan);
    commentDiv.appendChild(roleSpan);
    commentDiv.appendChild(contentSpan);

    // Rich Text Editor for editing the comment
    const commentEditorContainer = document.createElement('div');
    commentEditorContainer.className = "commentEditor";
    commentEditorContainer.style.display = "none";
    commentDiv.appendChild(commentEditorContainer);

    const commentQuill = new Quill(commentEditorContainer, quillSettingsComment);
    commentQuill.getModule('toolbar').container.style.display = "none";

    // Return the comment div
    return commentDiv;
}

/**
 * Insert content and user management buttons into a comment div
 * @param {HTMLDivElement} commentDiv
 * @param {number} currentUserId
 * @param {number} authorId
 * @returns {void}
 */
async function insertButtons(commentDiv, currentUserId, authorId){
    // Get the roles of the current user and the author
    const currentRole = await getRole(currentUserId);
    const authorRole = await getRole(authorId);
    const isAuthor = currentUserId === authorId;

    // Create Content Management Buttons
    const contentManagementButtons = getContentManagementButtons(currentRole, authorRole, isAuthor);
    commentDiv.prepend(contentManagementButtons);

    // Create User Management Buttons
    const userManagementButtons = getUserManagementButtons(currentRole, authorRole, isAuthor);
    commentDiv.prepend(userManagementButtons);

    // Add event listeners to the content management buttons if they exist
    const editButton = contentManagementButtons.querySelector(".editContentButton");
    const submitEditButton = contentManagementButtons.querySelector(".submitEditContentButton");
    const deleteButton = contentManagementButtons.querySelector(".deleteContentButton");

    editButton && editButton.addEventListener("click", () => toggleEditComment(commentDiv));
    submitEditButton && submitEditButton.addEventListener("click", () => submitEditComment(commentDiv));
    deleteButton && deleteButton.addEventListener("click", () => deleteComment(commentDiv));

    // Add event listeners to the user management buttons if they exist
    const banButton = userManagementButtons.querySelector(".banButton");
    const promoteToModButton = userManagementButtons.querySelector(".promoteToModButton");
    const promoteToAdminButton = userManagementButtons.querySelector(".promoteToAdminButton");
    const demoteModButton = userManagementButtons.querySelector(".demoteModButton");
    const demoteAdminButton = userManagementButtons.querySelector(".demoteAdminButton");

    banButton && banButton.addEventListener("click", () => banUser(authorId));
    promoteToModButton && promoteToModButton.addEventListener("click", () => promoteToMod(authorId));
    promoteToAdminButton && promoteToAdminButton.addEventListener("click", () => promoteToAdmin(authorId));
    demoteModButton && demoteModButton.addEventListener("click", () => demoteMod(authorId));
    demoteAdminButton && demoteAdminButton.addEventListener("click", () => demoteAdmin(authorId));
}

/**
 * Toggle the visibility of the edit comment editor
 * @param {HTMLDivElement} commentDiv
 * @returns {void}
 */
async function toggleEditComment(commentDiv){
    commentDiv.dataset.editCommentVisible = commentDiv.dataset.editCommentVisible === 'false' ? 'true' : 'false';
    let editCommentVisible = commentDiv.dataset.editCommentVisible;

    // Toggle the comment content
    commentDiv.querySelector(".commentContent").style.display = editCommentVisible === 'true' ? "none" : "inline-block";
    
    // Toggle the editor
    commentDiv.querySelector(".commentEditor").style.display = editCommentVisible === 'true' ? "block" : "none";
    commentDiv.querySelector(".ql-toolbar").style.display = editCommentVisible === 'true' ? "block" : "none";

    // Toggle the text of the edit button
    commentDiv.querySelector(".editContentButton").textContent = editCommentVisible === 'true' ? "Zurück" : "Bearbeiten";

    // Toggle the submit button
    commentDiv.querySelector(".submitEditContentButton").style.display = editCommentVisible === 'true' ? "inline-block" : "none";

    // Set the content of the comment to the content of the editor
    const commentContent = commentDiv.querySelector(".commentContent").textContent;
    commentDiv.querySelector(".ql-editor").innerHTML = commentContent;
}

/**
 * Submit the edited comment content
 * @param {HTMLDivElement} commentDiv
 * @returns {void}
 */
async function submitEditComment(commentDiv){
    // Get the commentId and new comment content
    const commentId = commentDiv.dataset.commentId;
    const newCommentContent = commentDiv.querySelector(".ql-editor").innerHTML;

    // Send the new comment content to the backend
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "comments/id/" + commentId + "/edit/", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            },
            body: newCommentContent,
        });
    
    // Reload the site
    location.reload();
}

/**
 * Delete a comment
 * @param {HTMLDivElement} commentDiv
 * @returns {void}
 */
async function deleteComment(commentDiv){
    // Get the commentId
    const commentId = commentDiv.dataset.commentId;

    // Send the delete request
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "comments/id/" + commentId + "/delete/", {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            },
        });

    // Reload the site
    location.reload();
}