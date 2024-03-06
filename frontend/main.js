// Programmierprojekt Forum, 06.03.2024
// Luca Flühler, Lucien Ruffet, Sandro Kuster
// Beschreibung: Hauptseite des Forums

const postList = document.querySelector("#postList");

async function showCurrentUser(){
    const auth_token = localStorage.getItem("AuthToken");

    // If no token is found, display the authentication buttons (login and signup) and hide the user info element
    if (!auth_token) {
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

        // Display authentication buttons
        document.getElementById("authButtons").style.display = "block";
        document.getElementById("loggedInUser").style.display = "none";
        return;
    }

    // Display the user info
    const user = await response.json();
    document.getElementById("username").textContent = user.username;
    document.getElementById("email").textContent = user.email;
    document.getElementById("authButtons").style.display = "none";
    document.getElementById("loggedInUser").style.display = "block";
}

async function loadPosts(){     // TODO: Query for filtering posts
    const response = await fetch(BACKENDURL + "post/all/")
    const postsData = await response.json();
    const posts = postsData["result"];

    for (let i = 0; i < posts.length; i++) {
        const usernameResponse = await fetch(BACKENDURL + "user/id/" + posts[i]["user_id"] + "/username/");
        const usernameData = await usernameResponse.json();
        const username = usernameData["username"];

        const postElement = document.createElement('p');
        postElement.innerHTML = `<a href="${FRONTENDURL}frontend/pages/post.html?id=${posts[i]["post_id"]}">${posts[i]["title"]}</a> - ${username}`;
        postList.append(postElement);

    }
}

async function logout(){
    localStorage.removeItem("AuthToken");
    window.location.reload();
}

document.getElementById("logoutButton").addEventListener("click", logout);

loadPosts();
showCurrentUser();