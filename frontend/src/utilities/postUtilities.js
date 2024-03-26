/**
 * @file postUtilities.js
 * This file contains utility functions for post-related operations.
 */

/**
* Returns a post object from the backend.
* @param {number} postId - The id of the post to retrieve.
* @returns {object} The post object or null if the post does not exist.
*/
async function getPost(postId){
    const response = await fetch(BACKENDURL + `posts/id/${postId}/`);
    const data = await response.json();
    return response.ok ? data["post"] : null;
}

/**
 * Submit the edited post to the backend
 * @param {number} postId - The id of the post to edit
 * @param {HTMLDivElement} postDiv - The post div of the post to edit
 * @returns {Promise<void>}
 */
async function submitEditPostFunction(postId, postDiv){
    // Get the new post content
    const newPostContent = postDiv.querySelector(".ql-editor").innerHTML;

    // Send the new post content to the backend
    const auth_token = localStorage.getItem("AuthToken");

    const response = await fetch(
        BACKENDURL + "posts/id/" + postId + "/edit/", {
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

/**
 * Delete a post
 * @param {number} post_id - The id of the post to delete
 * @returns {Promise<void>}
 */
async function deletePost(postId){
    // Send the delete request
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "posts/id/" + postId + "/delete/", {
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