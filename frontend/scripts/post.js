const BACKENDURL = "http://localhost:8000/";

const commentList = document.querySelector("#commentList");
let postId = getPostIdFromUrl();


// Extract the post ID from the URL
function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}


async function loadPost(post_id){
    // Post laden
    const response = await fetch(BACKENDURL + "post/id/" + post_id);
    const post = await response.json();
    const postTitle = post["result"]["title"];
    const postContent = post["result"]["content"];
    
    // HTML Elemente einfügen
    document.querySelector("#postTitle").textContent = postTitle;
    document.querySelector("#postContent").textContent = postContent;
}


async function loadComments(post_id){
    // Kommentare laden
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/comments/all/");
    const comments = await response.json();
    const commentsArray = comments["result"];

    // HTML Elemente erstellen und einfügen
    for(let i = 0; i < commentsArray.length; i++){
        const newElement = document.createElement('p');
        newElement.textContent = commentsArray[i]["content"];
        commentList.append(newElement);
    }
}

console.log(postId);
loadPost(postId);
loadComments(postId);