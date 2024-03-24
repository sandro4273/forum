
async function vote(event, postId, vote){
    // Prevent the site from reloading
    event.preventDefault(); // WHY DOES THIS NOT WORK?

    // Send the vote request
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "posts/id/" + postId + "/vote/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            },
            body: vote,
        });
}

async function getVoteOfCurrentUser(postId){
    // Send the GET request, send auth token
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "posts/id/" + postId + "/votes/user/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            }
        });
    const vote = await response.json();
    return response.ok ? vote : null;
}