const colors = {
    "admin": "red",
    "user": "blue",
    "moderator": "green"
}

async function getRole(user_id){
    const response = await fetch(`${BACKENDURL}users/id/${user_id}/role/`);
    const role = await response.json();
    return role["role"];
}

function getRoleColor(role){
    return colors[role];
}