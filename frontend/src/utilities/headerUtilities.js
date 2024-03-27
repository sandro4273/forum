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

    // Add event listener to the logout button
    document.getElementById("logoutButton").addEventListener("click", logout);
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
 * Logs out the user by removing the token from the local storage
 */
async function logout(){
    localStorage.removeItem("AuthToken");
    window.location.reload();
}
