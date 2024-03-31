/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file main.js
 * This file contains the main script for the frontend. It allows users to search for posts, sort posts, and load
 * more posts.
 */

/**
 * Entry point of the script
 */
function onLoad() {
    // Add event listeners
    document.querySelector("#searchBar")
            .addEventListener("keypress", (event) => searchBarPressed(event));
    document.getElementById("sortDropdown").addEventListener("change", sortingChanged);

    // Display current user and load posts
    showCurrentUser();
    loadPosts();
}

/**
 * Updates the post list
 */
async function updatePostList(posts){
    const postList = document.getElementById("postList");

    if (posts.length === 0) {
        console.log("No posts found")
        return;
    }

    for (const post of posts) {
        const author_id = post["author_id"];

        const { username, userRole, roleColor } = await getUserDetails(author_id);

        const postElement = document.createElement('p');
postElement.innerHTML = `<a class="post" href="${FRONTENDURL}frontend/public/post.html?id=${post["post_id"]}"><p style="text-decoration: underline white; color:black;">${post["title"]}</p><div style="text-decoration: underline white;"> ${username} <span style="text-decoration: underline white;color: ${roleColor}">(${userRole})</span></div></a>`;
        postList.append(postElement);
    }
}

/**
 * Loads posts from the backend and displays them
 * @param {string} searchInput - The search input
 * @param {number} offset - The offset for the posts
 * @param {number} sort_type - The sort type for the posts
 * @returns {Promise<void>}
 */
async function loadPosts(searchInput = "", offset=0, sort_type=0){
    let postList = document.getElementById("postList");

    let endpoint = `${BACKENDURL}posts/?`;
    if (searchInput) endpoint += `search=${searchInput}&`;

    endpoint += `offset=${offset}&sort=${sort_type}`;

    const auth_token = localStorage.getItem("AuthToken");
    const postsResponse = await fetch(endpoint, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`
        }
    });

    const postsData = await postsResponse.json();
    const posts = postsData["posts"];

    // Clear the post list if the offset is 0 (meaning a new search was made or the sort type changed)
    if (offset === 0) postList.innerHTML = "";

    await updatePostList(posts);

    // If there was a load more button, remove it
    if (document.querySelector("#postList button")) {
        document.querySelector("#postList button").remove();
    }

    // If 10 posts are displayed, display a button to load more
    if (posts.length === 10) {
        const loadMoreButton = document.createElement('button');
        loadMoreButton.textContent = "Load more";
        loadMoreButton.addEventListener("click", () => loadPosts(searchInput, offset + 10, sort_type));
        postList.append(loadMoreButton);
    }
}

/**
 * Calls loadPosts with contents of the search bar if the enter key is pressed
 * @param {Event} event - The key press event
 * @returns {Promise<void>}
 */
async function searchBarPressed(event){
    if (event.key === "Enter") {
        const searchInput = document.getElementById("searchBar").value;
        await loadPosts(searchInput);
    }
}

/**
 * Calls loadPosts with the selected sort type. Also considers the search input
 */
async function sortingChanged(event){
    const sortTypeToInt = {
        "recommended": 0,
        "new": 1,
        "popular": 2,
        "controversial": 3
    };

    const sort_type = sortTypeToInt[event.target.value];
    const searchInput = document.getElementById("searchBar").value;
    await loadPosts(searchInput, 0, sort_type);
}

// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());
