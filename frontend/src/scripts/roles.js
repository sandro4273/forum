const colors = {
    "admin": "red",
    "user": "blue",
    "moderator": "green"
}

async function getRole(user_id){
    const response = await fetch(`${BACKENDURL}users/id/${user_id}/?fields=role`);
    const data = await response.json();
    return data["user"]["role"];
}

function getRoleColor(role){
    return colors[role];
}