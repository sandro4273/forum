// function is called when the page is fully loaded
function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitForm);

}


async function submitForm(){
    // extract title and content from form
    const postTitle = document.forms["createPost"]["postTitle"].value;
    const postContent = document.forms["createPost"]["postContent"].value;

    // API request
    const body= {   "user_id": 1,   // account system not implemented yet
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

// execute onLoad when page is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());