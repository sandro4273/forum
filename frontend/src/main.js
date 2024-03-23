// Programmierprojekt Forum, 06.03.2024
// Luca Flühler, Lucien Ruffet, Sandro Kuster
// Beschreibung: Hauptseite des Forums

const postList = document.querySelector("#postList");
document.querySelector("#searchBar").addEventListener("keypress", (event) => searchPosts(event));

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
        BACKENDURL + `users/me/`, {
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
    console.log(userData)
    document.getElementById("username").textContent = user["username"];
    document.getElementById("email").textContent = user["email"];

    // Display the logout button and hide the authentication buttons
    document.getElementById("authButtons").style.display = "none";
    document.getElementById("loggedInUser").style.display = "block";
}

async function loadPosts(){
    const postsResponse= await fetch(BACKENDURL + "posts/?offset=" + postList.children.length) // postList.children.length is 0 at the beginning
    const postsData = await postsResponse.json();
    const posts = postsData["posts"];

    for (let i = 0; i < posts.length; i++) {
        const author_id = posts[i]["author_id"]

        const usernameResponse = await fetch(BACKENDURL + "users/id/" + author_id + "/?fields=username");
        const usernameData = await usernameResponse.json();
        const username = usernameData["user"]["username"];

        const userRole = await getRole(author_id);
        const roleColor = getRoleColor(userRole);

        const postElement = document.createElement('p');
        postElement.innerHTML = `<a href="${FRONTENDURL}frontend/public/post.html?id=${posts[i]["post_id"]}">${posts[i]["title"]}</a> - ${username} <span style="color: ${roleColor}">(${userRole})</span>`;
        postList.append(postElement);

    }

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

async function searchPosts(event, offset=0){
    // If the event is not the enter key or coming from the load more button, return
    if (!(event == "next" || event.key == "Enter")) {
        return;
    }
    const searchInput = document.getElementById("searchBar").value;
    const postsResponse = await fetch(`${BACKENDURL}posts/search/?search=${searchInput}&offset=${offset}`);
    const postsData = await postsResponse.json();
    const posts = postsData["posts"];

    // Clear the post list if the offset is 0 (meaning a new search was made)
    postList.innerHTML = offset === 0 ? "" : postList.innerHTML;

    for (let i = 0; i < posts.length; i++) {
        const author_id = posts[i]["author_id"]

        const usernameResponse = await fetch(BACKENDURL + "users/id/" + author_id + "/?fields=username");
        const usernameData = await usernameResponse.json();
        const username = usernameData["user"]["username"];

        const userRole = await getRole(author_id);
        const roleColor = getRoleColor(userRole);

        const postElement = document.createElement('p');
        postElement.innerHTML = `<a href="${FRONTENDURL}frontend/public/post.html?id=${posts[i]["post_id"]}">${posts[i]["title"]}</a> - ${username} <span style="color: ${roleColor}">(${userRole})</span>`;
        postList.append(postElement);
    }

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

async function logout(){
    localStorage.removeItem("AuthToken");
    window.location.reload();
}

document.getElementById("logoutButton").addEventListener("click", logout);

loadPosts();
showCurrentUser();
