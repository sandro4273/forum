// Maps roles to colors.
const colors = {
    "admin": "red",
    "user": "blue",
    "moderator": "green"
}

/**
 * Returns the role of a user.
 */
async function getRole(user_id){
    const response = await fetch(`${BACKENDURL}users/id/${user_id}/?fields=role`);
    const data = await response.json();
    return data["user"]["role"];
}

/**
 * Returns the color associated with a role.
 */
function getRoleColor(role){
    return colors[role];
}
