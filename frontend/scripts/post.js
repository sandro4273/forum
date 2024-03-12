// Funktion wird ausgeführt wenn Seite geladen ist
async function onLoad(){
    // Get post ID from URL
    let postId = getPostIdFromUrl();
    document.querySelector("#submitComment").addEventListener("click", (event) => createComment(event, postId));
    //console.log(postId);

    await toggleCommentFormVisibility();
    await loadPost(postId);
    await loadTags(postId);
    await loadComments(postId);
}

async function toggleCommentFormVisibility(){
    // Check if user is logged in
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `get_current_user_id/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`
        }
    });

    // If user is logged in, display the comment form
    const commentForm = document.getElementById('commentForm');
    commentForm.style.display = response.ok ? 'block' : 'none';
}

// Extract the post ID from the URL
function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}


async function loadPost(post_id){
    // load title and content
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/");
    const post = await response.json();
    const postTitle = post["result"]["title"];
    const postContent = post["result"]["content"];

    // load author and role
    const usernameResponse = await fetch(BACKENDURL + "user/id/" + post["result"]["user_id"] + "/username/");
    const usernameData = await usernameResponse.json();
    const username = usernameData["username"];

    const userRole = await getRole(username);
    const roleColor = getRoleColor(userRole);
    
    // insert post into HTML
    document.querySelector("#postTitle").innerHTML = `${postTitle}  ---  ${username} <span style="color: ${roleColor}">(${userRole})</span>`;
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


// execute onLoad when page is loaded
window.addEventListener("DOMContentLoaded", onLoad());