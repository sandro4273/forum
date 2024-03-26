// Programmierprojekt Forum, 06.03.2024
// Luca Flühler, Lucien Ruffet, Sandro Kuster
// Beschreibung: Hauptseite des Forums

/**
 * Displays the username and email of the logged-in user. Otherwise, displays the authentication buttons.
 */
async function showCurrentUser(){
    const auth_token = localStorage.getItem("AuthToken");

    if (!auth_token) {
        // Display authentication buttons and hide the user info
        document.getElementById("authButtons").style.display = "block";
        document.getElementById("loggedInUser").style.display = "none";
        return;
    }

    // If a token is found, check if it is valid and retrieve the user info
    const response = await fetch(
        BACKENDURL + `users/me/?fields=username,email`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`
        }
    });

    if (!response.ok) {
        // Token is invalid, remove it from local storage
        localStorage.removeItem("AuthToken");

        // Display authentication buttons and hide the user info
        document.getElementById("authButtons").style.display = "block";
        document.getElementById("loggedInUser").style.display = "none";
        return;
    }

    // Display the user info
    const userData = await response.json();
    const user = userData["user"];
    document.getElementById("username").textContent = user["username"];
    document.getElementById("email").textContent = user["email"];

    // Display the logout button and hide the authentication buttons
    document.getElementById("authButtons").style.display = "none";
    document.getElementById("loggedInUser").style.display = "block";
}

/**
 * Returns the username and role of a user.
 */
async function getUserDetails(user_id) {
    const response = await fetch(`${BACKENDURL}users/id/${user_id}/?fields=username,role`);
    const data = await response.json();

    const username = data["user"]["username"];
    const userRole = data["user"]["role"];
    const roleColor = getRoleColor(userRole);
    return { username, userRole, roleColor };
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
        postElement.innerHTML = `<div class="post"><a style="text-decoration: none;color:black" href="${FRONTENDURL}frontend/public/post.html?id=${post["post_id"]}">${post["title"]}</a><div> ${username} <span style="color: ${roleColor}">(${userRole})</span></div></div>`;
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

    const postsResponse = await fetch(endpoint);
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

/**
 * Logs out the user by removing the token from the local storage
 */
async function logout(){
    localStorage.removeItem("AuthToken");
    window.location.reload();
}

/**
 * Entry point of the script
 */
function onLoad() {
    // Add event listeners
    document.querySelector("#searchBar")
            .addEventListener("keypress", (event) => searchBarPressed(event));
    document.getElementById("logoutButton").addEventListener("click", logout);
    document.getElementById("sortDropdown").addEventListener("change", sortingChanged);

    // Display current user and load posts
    showCurrentUser();
    loadPosts();
}

// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());
