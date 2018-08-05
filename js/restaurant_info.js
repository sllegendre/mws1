let restaurant;
var map;
const reviewsEndpoint = "http://localhost:1337/reviews/";
let favoritesEndpoint = "";
var isFavorite = false;


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
    fillReviewsHTML();
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
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {

    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);
    let objectStoreName = "reviewsStore";

    // open database
    let dbPromise = idb.open('reviewsDB', 1, function (upgradeDb) {
        let restaurantsStore = upgradeDb.createObjectStore(objectStoreName, {keyPath: 'id'});
    });

    dbPromise.then(function (db) {

        // fetch json from server
        fetch(reviewsEndpoint).then(response => response.json()).then(function (reviewsData) {
            const ul = document.getElementById('reviews-list');

            // opening db transaction
            let tx = db.transaction(objectStoreName, 'readwrite');
            let reviewStore = tx.objectStore(objectStoreName);

            // Adding each review to the DOM and the DB
            reviewsData.forEach(review => {
                reviewStore.put(review).catch(reason => console.log(reason));
                if (review.restaurant_id == self.restaurant.id) {
                    ul.appendChild(createReviewHTML(review));
                }
            });

            container.appendChild(ul);

        }).catch(function (reason) {
            console.log(reason);
            reviewStore.getAll().then(function (reviewsFromDB) {

                reviewsFromDB.forEach(review => {
                    reviewStore.put(review).catch(reason => console.log(reason));
                    if (review.restaurant_id == self.restaurant.id) {
                        ul.appendChild(createReviewHTML(review));
                    }
                });
            }).catch(function (reason) {
                console.log(reason);
                const noReviews = document.createElement('p');
                noReviews.innerHTML = 'No reviews yet!';
                container.appendChild(noReviews);
            });


        });

    });
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

    // Display it
    const ul = document.getElementById('reviews-list');
    ul.insertBefore(createReviewHTML(reviewData), ul.firstChild);
    reviewForm.reset();


    // Try to post it
    let postPromise = fetch(reviewsEndpoint, {
        method: 'post',
        body: reviewData,
    });

    postPromise.then(response => response.json()).then(function (resp) {
        console.log(resp);
    });

    // If it does not go through save it in a db and register a sync event
    postPromise.catch(function (reason) {
        console.log('does not go through save it in a db and register a sync event');
        console.log(reason);
        DBHelper.putReviewInDB(reviewData);
        navigator.serviceWorker.ready.then(function (swRegistration) {
            console.log(swRegistration.sync.register('sendReview'));
        });
    });

    return false;

};


let toggleFav = function () {
    const favoriteButton = document.getElementById('favoriteButton');

    fetch(favoritesEndpoint, {
        method: 'put'
    }).then(response => response.json()).then(function (resp) {
        console.log(resp);
        isFavorite = !isFavorite;
        console.log("isFavorite is now: " + isFavorite);
        console.log(favoriteButton.innerText);
        if (favoriteButton.innerText == "favorite") favoriteButton.innerText = "unfavorite";
        else favoriteButton.innerText = "favorite";
    });


};


/**
 * Find out if favorite
 */
findOutFavorite = (isFavorite = self.isFavorite, restaurant = self.restaurant) =>  {
    let oppositeFav = !isFavorite;
    console.log(window.location.href.split('=')[1]);
    let inbetween = "/" + window.location.href.split('=')[1] + "/" + "?is_favorite=";


    favoritesEndpoint = "http://localhost:1337/restaurants" + inbetween + oppositeFav.toString();
    console.log(favoritesEndpoint);


    // fetch("http://localhost:1337/restaurants/?is_favorite=true").catch(response => response.json()).then(function (resp) {
    //     console.log("feteched favs");
    //     console.log(resp);
    //
    // });
};

findOutFavorite();
