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
        this.commentContainer.prepend(this.contentManagementButtons);

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