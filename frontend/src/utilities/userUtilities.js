async function getUsername(userId){
    const response = await fetch(BACKENDURL + `users/id/${userId}/?field=username`);
    const data = await response.json();
    return response.ok ? data["user"]["username"] : null;
}


async function getCurrentUserId(){
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `users/me/?fields=user_id`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`
        }
    });
    const data = await response.json();

    return response.ok ? data["user"]["user_id"] : null;
}