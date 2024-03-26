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

    for (const post of posts) {
        const author_id = post["author_id"];

        const { username, userRole, roleColor } = await getUserDetails(author_id);

        const postElement = document.createElement('p');
        postElement.innerHTML = `<div class="post"><a style="text-decoration: none;color:black" href="${FRONTENDURL}frontend/public/post.html?id=${post["post_id"]}">${post["title"]}</a><div> ${username} <span style="color: ${roleColor}">(${userRole})</span></div></div>`;
        postList.append(postElement);
    }
}

/**
 * Loads all posts and displays them. If there are more than 10 posts, a button to load more is displayed.
 */
async function loadPosts(){
    let postList = document.getElementById("postList");

    // postList.children.length is 0 at the beginning
    const postsResponse= await fetch(BACKENDURL + "posts/?offset=" + postList.children.length)
    const postsData = await postsResponse.json();
    const posts = postsData["posts"];

    await updatePostList(posts);

    // If there was a load more button, remove it
    if (document.querySelector("#loadMoreButton")) {
        document.querySelector("#loadMoreButton").remove();
    }

    // If 10 posts are displayed, display a button to load more
    if (posts.length === 10) {
        const loadMoreButton = document.createElement('button');
        loadMoreButton.id = "loadMoreButton";
        loadMoreButton.textContent = "Load more";
        loadMoreButton.addEventListener("click", loadPosts);
        postList.append(loadMoreButton);
    }
}

/**
 * Searches for posts based on the search input and displays them.
 */
async function searchPosts(event, offset=0){
    let postList = document.getElementById("postList");

    // If the event is not the enter key or coming from the load more button, return
    if (!(event === "next" || event.key === "Enter")) {
        return;
    }
    const searchInput = document.getElementById("searchBar").value;
    const postsResponse = await fetch(`${BACKENDURL}posts/search/?search=${searchInput}&offset=${offset}`);
    const postsData = await postsResponse.json();
    const posts = postsData["posts"];

    // Clear the post list if the offset is 0 (meaning a new search was made)
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
        loadMoreButton.addEventListener("click", () => searchPosts("next", offset=offset + 10));
        postList.append(loadMoreButton);
    }
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
            .addEventListener("keypress", (event) => searchPosts(event));
    document.getElementById("logoutButton").addEventListener("click", logout);

    // Display current user and load posts
    showCurrentUser();
    loadPosts();
}

// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());
