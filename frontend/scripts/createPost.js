// Funktion wird ausgeführt wenn Seite geladen ist
function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitForm);

}


async function submitForm(){
    // Titel und Text extrahieren
    const post_title = document.forms["createPost"]["postTitle"].value;
    const post_content = document.forms["createPost"]["postContent"].value;

    // Retrieve the user_id of the logged in user
    const auth_token = localStorage.getItem("AuthToken");
    const user_id_response = await fetch(
        BACKENDURL + `get_current_user_id/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`
        }
    });

    const user_id = await user_id_response.json();

    // Create post with user_id, title and content
    const body= {
        "title": post_title,
        "content": post_content
    };

    const create_post_response = await fetch(
        BACKENDURL + "post/create_post/", {
            method: "POST", 
            headers: {
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${auth_token}`
            },
            body: JSON.stringify(body),
        });

    let post_id = await create_post_response.json();
    window.location.href = "/ProgProjekt_Forum/frontend/pages/post.html?id=" + post_id;
    return post_id;
}

// Init ausführen wenn Seite geladen ist
window.addEventListener("DOMContentLoaded", onLoad());