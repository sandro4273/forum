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
    const comments = await response.json();
    const commentsArray = comments["result"];

    // create HTML elements for each comment and insert them
    for(let i = 0; i < commentsArray.length; i++){
        const newElement = document.createElement('p');
        newElement.textContent = commentsArray[i]["content"];
        commentList.append(newElement);
    }
}


async function createComment(event, post_id){
    event.preventDefault();
    // extract comment content
    const content = document.forms["createComment"]["commentContent"].value;

    // send comment to backend
    const body = {
        "user_id": 1, // account system not implemented yet
        "content": content,
    }
    const response = await fetch(
        BACKENDURL + "post/id/" + post_id + "/create_comment/", {
            method: "POST", 
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(body),
        });
    // empty comment form
    document.forms["createComment"]["commentContent"].value = "";

    res = await response;
    return response;
}


// execute onLoad when page is loaded
window.addEventListener("DOMContentLoaded", onLoad());