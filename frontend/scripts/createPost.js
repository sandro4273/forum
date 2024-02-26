// Funktion wird ausgeführt wenn Seite geladen ist
function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitForm);

}


async function submitForm(){
    // Titel und Text extrahieren
    const postTitle = document.forms["createPost"]["postTitle"].value;
    const postContent = document.forms["createPost"]["postContent"].value;

    // API request
    const body= {   "user_id": 1,   // Account-System noch nicht implementiert
                    "title": postTitle,
                    "content": postContent};
    const response = await fetch(
        BACKENDURL + "post/create_post/", {
            method: "POST", 
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(body),
        });
    res = await response.json();
    return response;
    
    // Redirect to post
}

// Init ausführen wenn Seite geladen ist
window.addEventListener("DOMContentLoaded", onLoad());