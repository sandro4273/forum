// Funktion wird ausgeführt wenn Seite geladen ist
function onLoad(){
    const commentList = document.querySelector("#commentList");
    let postId = getPostIdFromUrl();
    document.querySelector("#submitComment").addEventListener("click", (event) => createComment(event, postId));
    //console.log(postId);

    loadPost(postId);
    loadComments(postId);
}

// Extract the post ID from the URL
function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}


async function loadPost(post_id){
    // load post
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/");
    const post = await response.json();
    const postTitle = post["result"]["title"];
    const postContent = post["result"]["content"];
    
    // insert post into HTML
    document.querySelector("#postTitle").textContent = postTitle;
    document.querySelector("#postContent").textContent = postContent;
}


async function loadComments(post_id){
    // load comments
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/comments/all/");
    const commentsData = await response.json();
    const comments = commentsData["result"];

    // HTML Elemente erstellen und einfügen
    for(let i = 0; i < comments.length; i++){
        const comment = comments[i];

        // Get username of the user who created the comment
        const usernameResponse = await fetch(BACKENDURL + "user/id/" + comment["user_id"] + "/username/");
        const usernameData = await usernameResponse.json();
        const username = usernameData["username"];

        // Create a container for the comment
        const commentContainer = document.createElement('div');

        // Display creation time (in gray)
        const creationTimeElement = document.createElement('span');
        creationTimeElement.textContent = comment["created_at"];
        creationTimeElement.style.color = "gray";
        commentContainer.appendChild(creationTimeElement);

        // Display user ID
        const userIDElement = document.createElement('span');
        userIDElement.textContent = " - " + username + ": ";
        commentContainer.appendChild(userIDElement);

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

    // Clear comment form
    document.forms["createComment"]["commentContent"].value = "";

    return await create_comment_response.json();
}


// execute onLoad when page is loaded
window.addEventListener("DOMContentLoaded", onLoad());