const postList = document.querySelector("#postList");

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));

    return JSON.parse(jsonPayload);
}

async function checkToken(){
    const token = localStorage.getItem("token");
        if (token) {
            console.log("Token found:", token)
            // Decode the token to extract user information
            const decodedToken = parseJwt(token);
            const userId = decodedToken.user_id;
            const response = await fetch(BACKENDURL + "user/id/" + userId + "/");
            const user = await response.json();

            // Display the user ID
            document.getElementById("username").textContent = user["result"].username;
            document.getElementById("email").textContent = user["result"].email;
            document.getElementById("authButtons").style.display = "none";
            document.getElementById("loggedInUser").style.display = "block";
        } else {
            console.log("No token found")
            // No token found, display authentication buttons
            document.getElementById("authButtons").style.display = "block";
            document.getElementById("loggedInUser").style.display = "none";
        }
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
    localStorage.removeItem("token");
    window.location.reload();
}

document.getElementById("logoutButton").addEventListener("click", logout);

loadPosts();
checkToken();