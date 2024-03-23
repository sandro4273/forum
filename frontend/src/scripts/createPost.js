// Rich Text Editor
const quill = new Quill('#postContentEditor', quillSettingsPost);

// function is called when the page is fully loaded
function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitForm);
}

async function submitForm(){
    // Extract text and title from form
    const post_title = document.forms["createPost"]["postTitle"].value;
    const post_content = quill.root.innerHTML;

    const body= {
        "title": post_title,
        "content": post_content
    };

    // Create post and retrieve the post_id
    const auth_token = localStorage.getItem("AuthToken");
    const create_post_response = await fetch(
        `${BACKENDURL}posts/create_post/`, {
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

    const post_data = await create_post_response.json();
    const post_id = post_data["post_id"];


    // Redirect to the post page
    window.location.href = "/frontend/public/post.html?id=" + post_id;

    return post_data;
}

// execute onLoad when page is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());