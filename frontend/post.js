const BACKENDURL = "http://localhost:8000/";

const commentList = document.querySelector("#commentList");


// Extract the post ID from the URL
function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}


async function loadComments(post_id){
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/comments/")
    const comments = await response.json();
    const commentsArray = comments["result"];
    for(let i = 0; i < commentsArray.length; i++){
        const newElement = document.createElement('li');
        newElement.textContent = commentsArray[i]["content"];
        console.log(commentsArray[i]);
        commentList.append(newElement);
    }
}

console.log(getPostIdFromUrl());
loadComments(getPostIdFromUrl());