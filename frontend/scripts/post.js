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
    // Post laden
    const response = await fetch(BACKENDURL + "post/id/" + post_id + "/");
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


async function createComment(event, post_id){
    event.preventDefault();
    // Kommentar extrahieren
    const content = document.forms["createComment"]["commentContent"].value;

    // Kommentar senden
    const body = {
        "user_id": 1, // Account-System noch nicht implementiert
        "content": content,
    }
    const response = await fetch(
        BACKENDURL + "post/id/" + post_id + "/create_comment/", {
            method: "POST", 
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(body),
        });
    // Kommentarfeld leeren
    document.forms["createComment"]["commentContent"].value = "";

    res = await response;
    return response;
}


// Init ausführen wenn Seite geladen ist
window.addEventListener("DOMContentLoaded", onLoad());