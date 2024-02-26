const postList = document.querySelector("#postList");

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

loadPosts();