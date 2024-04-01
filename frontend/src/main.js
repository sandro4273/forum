/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file main.js
 * This file contains the main script for the frontend. It allows users to search for posts, sort posts, and load
 * more posts.
 */

/**
 * Loads posts from the backend and displays them
 * @param {string} searchInput - The search input
 * @param {number} offset - The offset for the posts
 * @param {number} sort_type - The sort type for the posts
 * @returns {Promise<void>}
 */
async function fetchAndDisplayPosts(searchInput = "", offset=0, sort_type=0){
    let postList = document.getElementById("postList");

    let endpoint = `${BACKENDURL}posts/?`;
    if (searchInput) endpoint += `search=${searchInput}&`;

    endpoint += `offset=${offset}&sort=${sort_type}`;

    const authToken = localStorage.getItem("AuthToken");
    const postsResponse = await fetch(endpoint, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
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
        loadMoreButton.className = "loadmorebutton"
        loadMoreButton.addEventListener("click", () => fetchAndDisplayPosts(searchInput, offset + 10, sort_type));
        postList.append(loadMoreButton);
    }
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

        const postElement = document.createElement('div');
        postElement.innerHTML = `<a class="post" style="position:relative;" href="${FRONTENDURL}frontend/public/post.html?id=${post["post_id"]}"><p style="text-decoration: underline white; color:black;">${post["title"]}</p><div style="text-decoration: underline white;color:black;"> ${username} <span style="text-decoration: underline white;color: ${roleColor}">(${userRole})</span></div></a>`;
        postList.append(postElement);
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
        await fetchAndDisplayPosts(searchInput);
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
    await fetchAndDisplayPosts(searchInput, 0, sort_type);
}

/**
 * Initializes the main application logic.
 * - Attaches event listeners to search bar and sorting dropdown.
 * - Displays the current user's information.
 * - Fetches and displays the initial list of posts.
 */
async function initialize() {
    try {
        // Add event listeners
        document.getElementById("searchBar")
                .addEventListener("keypress", searchBarPressed);
        document.getElementById("sortDropdown").addEventListener("change", sortingChanged);

        await displayAuthStatus();
        await fetchAndDisplayPosts(); // Initial loading
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", initialize);
