const colors = {
    "admin": "red",
    "user": "blue",
    "moderator": "green"
}

async function getRole(username){
    const response = await fetch(`${BACKENDURL}user/name/${username}/role/`);
    const role = await response.json();
    return role["role"];
}

function getRoleColor(role){
    return colors[role];
}