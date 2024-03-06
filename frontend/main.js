// Programmierprojekt Forum, 06.03.2024
// Luca Flühler, Lucien Ruffet, Sandro Kuster
// Beschreibung: Hauptseite des Forums

const postList = document.querySelector("#postList");

async function loadPosts(){     // TODO: Query for filtering posts
    const response = await fetch(BACKENDURL + "post/all/")
    const posts = await response.json();
    const postsArray = posts["result"];
    for(let i = 0; i < postsArray.length; i++){
        // Create link to post
        const link = document.createElement('a');
        link.setAttribute("href", FRONTENDURL + "frontend/pages/post.html?id=" + postsArray[i]["post_id"]);
        // Append element to postList
        const newElement = document.createElement('p');
        newElement.appendChild(link).textContent = postsArray[i]["title"];
        postList.append(newElement);
    }
}

loadPosts();