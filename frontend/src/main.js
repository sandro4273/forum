// Programmierprojekt Forum, 06.03.2024
// Luca Flühler, Lucien Ruffet, Sandro Kuster
// Beschreibung: Hauptseite des Forums

const postList = document.querySelector("#postList");

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
        BACKENDURL + `get_current_user/`, {
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
    document.getElementById("username").textContent = user.username;
    document.getElementById("email").textContent = user.email;

    // Display the logout button and hide the authentication buttons
    document.getElementById("authButtons").style.display = "none";
    document.getElementById("loggedInUser").style.display = "block";
}

async function loadPosts(){     // TODO: Query for filtering posts
    const postsResponse= await fetch(BACKENDURL + "posts/get/?offset=" + postList.children.length) // postList.children.length is 0 at the beginning
    const postsData = await postsResponse.json();
    const posts = postsData["posts"];

    for (let i = 0; i < posts.length; i++) {
        const usernameResponse = await fetch(BACKENDURL + "users/id/" + posts[i]["user_id"] + "/username/");
        const usernameData = await usernameResponse.json();
        const username = usernameData["username"];

        const userRole = await getRole(username);
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
        loadMoreButton.addEventListener("click", loadPosts);
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
