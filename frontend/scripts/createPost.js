// function is called when the page is fully loaded
function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitForm);

}


async function submitForm(){
    // Extract text and title from form
    const post_title = document.forms["createPost"]["postTitle"].value;
    const post_content = document.forms["createPost"]["postContent"].value;

    const body= {
        "title": post_title,
        "content": post_content
    };

    // Create post and retrieve the post_id
    const auth_token = localStorage.getItem("AuthToken");

    const create_post_response = await fetch(
        BACKENDURL + "post/create_post/", {
            method: "POST", 
            headers: {
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${auth_token}`
            },
            body: JSON.stringify(body),
        });

    if (!create_post_response.ok){
        document.getElementById("errorMessage").style.display = "block";
        return;
    }

    let post_id = await create_post_response.json();
    console.log(post_id);

    // Redirect to the post page
    window.location.href = "/frontend/pages/post.html?id=" + post_id;

    return post_id;
}

// execute onLoad when page is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());