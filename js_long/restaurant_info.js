let restaurant;
var map;
let reviewsEndpoint = "http://localhost:1337/reviews/";
let favoritesEndpoint = "";
let timesThisBitchHasBeenCalled = 0;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
            });
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
    });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant);
        });
    }

};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = "This is an image of the " + restaurant.name.toString() + " restaurant.";

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    DBHelper.fetchReviewsForRestaurant(reviewsEndpoint, self.restaurant.id, fillReviewsHTML);
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }

    setFav();

};

/**
 * Create all reviews HTML and add them to the webpage.
 */
async function fillReviewsHTML(reviews) {

    const container = document.getElementById('reviews-container');
    const reviewForm = document.getElementById('submit-review');
    if(await checkIfElemPresent("reviews-header")) {
        const title = document.getElementById("reviews-header");
        title.innerHTML = 'Reviews';
    }else{
        const title = document.createElement('h2');
        title.id = "reviews-header";
        title.innerHTML = 'Reviews';
        container.insertBefore(title, reviewForm);
    }

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
    } else {
        const ul = document.getElementById('reviews-list');
        reviews.forEach(review => {
            if (review.restaurant_id == self.restaurant.id) {
                ul.appendChild(createReviewHTML(review));
            }
        });
        container.appendChild(ul);
    }

}


/**
 * Check if title is there already
*/
checkIfElemPresent = (elemID) => {
    try {
        let wurst = document.getElementById(elemID);
        console.log("returning true");
        return wurst;
    } catch (e) {
        console.log(e);
        console.log("returning false");
        return false;
    }
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.createdAt;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};


let submitReview = function () {

    // Get data from form

    let reviewForm = document.forms["submit-review"];

    reviewData = {
        "restaurant_id": self.restaurant.id,
        "name": reviewForm["review-name"].value,
        "rating": reviewForm["review-rating"].value,
        "comments": reviewForm["review-comments"].value,
    };

    console.log(reviewData);

    // Display it
    const ul = document.getElementById('reviews-list');
    ul.insertBefore(createReviewHTML(reviewData), ul.firstChild);


    // Try to post it
    let postPromise = fetch(reviewsEndpoint, {
        method: 'POST',
        body: JSON.stringify(reviewData)
    });

    postPromise.then(response => response.json()).then(function (resp) {
        console.log(resp);
        DBHelper.putReviewInNormalDB(resp);
        reviewForm.reset();
    });

    // If it does not go through save it in a db and register a sync event
    postPromise.catch(function (reason) {
        console.log('does not go through save it in a db and register a sync event');
        console.log(reason);
        DBHelper.uploadReviewLaterFromDB(reviewData);
        navigator.serviceWorker.ready.then(function (swRegistration) {
            console.log(swRegistration.sync.register('sendReview'));
        });
    });

    return false;

};

// Calls the endpoint to toggle fav situation
toggleFav = () => {
    fetch(favoritesEndpoint, {
        method: 'put'
    }).then(response => response.json()).then(function (resp) {
        self.restaurant = resp;
        setFav();
    });
};

/**
 * Initialize the favorite situation
 */
setFav = () => {

    // Make sure member is boolean... server responses so and so
    if (self.restaurant.is_favorite.toString() == "true") self.restaurant.is_favorite = true;
    else self.restaurant.is_favorite = false;

    // Set button
    setFavButton(self.restaurant.is_favorite);

    //Set URL
    setFavoritURL(!self.restaurant.is_favorite);
};

/**
 * Set right URL to change fav status
 */
setFavoritURL = (lastParam) => {
    let inbetween = "/" + window.location.href.split('=')[1] + "/" + "?is_favorite=";
    favoritesEndpoint = "http://localhost:1337/restaurants" + inbetween + lastParam;
};


setFavButton = () => {
    const favoriteButton = document.getElementById('favorite-button');
    if (self.restaurant.is_favorite) favoriteButton.innerText = "unfavorite";
    else favoriteButton.innerText = "favorite";
};


// from: https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
