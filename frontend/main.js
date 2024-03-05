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

async function loadPosts(){     // Spöter mal en max. azahl vo gladene Posts ibaue
    const response = await fetch(BACKENDURL + "post/all/")
    const posts = await response.json();
    const postsArray = posts["result"];
    for(let i = 0; i < postsArray.length; i++){
        // Link erstelle
        const link = document.createElement('a');
        link.setAttribute("href", FRONTENDURL + "frontend/pages/post.html?id=" + postsArray[i]["post_id"]);
        // Neues Element met link zum Post und Kommentär
        const newElement = document.createElement('p');
        newElement.appendChild(link).textContent = postsArray[i]["title"];
        postList.append(newElement);
    }
}

async function logout(){
    localStorage.removeItem("AuthToken");
    window.location.reload();
}

document.getElementById("logoutButton").addEventListener("click", logout);

loadPosts();
showCurrentUser();