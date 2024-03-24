/**
* Returns a post object from the backend.
* @param {number} postId - The id of the post to retrieve.
* @returns {object} The post object.
*/
async function getPost(postId){
    const response = await fetch(BACKENDURL + `posts/id/${postId}/`);
    const data = await response.json();
    return response.ok ? data["post"] : null;
}

/**
 * Returns a div containing the post's title and content along with the author's username and role.
 * @param {object} post - The post object.
 * @returns {HTMLElement} The div containing the post's title and content.
 */
async function getPostDiv(post){
    // load title and content
    const postTitle = post["title"];
    const postContent = post["content"];

    // load author and role
    const authorRole = await getRole(authorId);
    const roleColor = getRoleColor(authorRole);
    
    // insert post into HTML
    document.querySelector("#postTitle").innerHTML = `${postTitle}  ---  ${authorUsername} <span style="color: ${roleColor}">(${authorRole})</span>`;
    document.querySelector("#postContent").innerHTML = postContent;
}

async function submitEditPostFunction(post_id){
    // Get the new post content
    const newPostContent = postQuill.root.innerHTML;

    // Send the new post content to the backend
    const auth_token = localStorage.getItem("AuthToken");

    const response = await fetch(
        BACKENDURL + "posts/id/" + post_id + "/edit/", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            },
            body: newPostContent,
        });

    await response.json();
    

    // Reload the site
    location.reload();
}

async function deletePost(post_id){
    // Send the delete request
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "posts/id/" + post_id + "/delete/", {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            },
        });

    // Redirect to the index page, but only if the request was successful
    if(response.ok){
        window.location.href = "/frontend/public/index.html";
    }
}