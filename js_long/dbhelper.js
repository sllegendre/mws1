/**
 * Common database helper functions.
 */




class DBHelper {


    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        //return `http://localhost:${port}/data/restaurants.json`;
        return `http://localhost:${port}/restaurants`;
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {

        // open database
        var dbPromise = idb.open('restaurantsDB', 1, function (upgradeDb) {
            var restaurantsStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});

        });

        //Try to get new restaurants but regardless of whether I get fresh restaurants, return whats in the db
        dbPromise.then(function (db) {

            // fetch json from server
            fetch(DBHelper.DATABASE_URL).then(response => response.json()).then(function (data) {
                var restaurantData = data;


                var tx = db.transaction('restaurants', 'readwrite');
                var store = tx.objectStore('restaurants');

                if (restaurantData) { //I have fresh restaurants data, so I'll write it to the db
                    restaurantData.forEach(
                        function (restaurant) {
                            store.put(restaurant);
                        }
                    );
                }

                // return what I got from the database
                callback(null, restaurantData);
            }).catch(error => console.log(error)).then(function () {
                var tx = db.transaction('restaurants', 'readonly');
                var store = tx.objectStore('restaurants');
                store.getAll().then(function (data) {
                    callback(null, data);
                }).catch(error => callback(error, null));
            });

        });

        dbPromise.catch(function (reason) { //Not sure if this works. If for some reason the promise does not resolve
            console.log("failed...reason is");
            console.log(reason);
            callback(reason, null);
        });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.photograph}` + '.jpg');
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
                position: restaurant.latlng,
                title: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant),
                map: map,
                animation: google.maps.Animation.DROP
            }
        );
        return marker;
    }

    /**
     * Submit review
     */
    static submitReviewsSavedUntilOnline() {
        console.log("start to submit saved reviews...");

        let objectStoreName = "laterStore";

        let dbPromise = idb.open('postLaterDB', 1, function (upgradeDb) {
            let laterStore = upgradeDb.createObjectStore(objectStoreName);
        });
        dbPromise.then(function (db) {
            // opening db transaction
            let tx = db.transaction(objectStoreName, 'readwrite');
            let laterStore = tx.objectStore(objectStoreName);
            console.log("getting stuff out of the store...hopefully");

            laterStore.getAll().then(function (allToPost) {
                console.log("could get summin to post");
                console.log(allToPost);
                allToPost.forEach(function (reviewData) {
                    console.log("just before post");
                    fetch("http://localhost:1337/reviews/", {
                        method: 'post',
                        body: reviewData,
                    }).then(response => response.json()).then(function (resp) {
                        console.log(resp);
                        console.log("could now post...todo: delete entry");
                    }).catch(function () {
                        console.log("could still not post...");
                    });
                });
            }).catch(reason => console.log('nothing from store to post now...'));

        });

        dbPromise.catch(reason => console.log("could not open db..."));


    };


    static putReviewInDB(reviewData) {

        let objectStoreName = "laterStore";
        // Save the badboy locally to post later
        let dbPromise = idb.open('postLaterDB', 1, function (upgradeDb) {
            let laterStore = upgradeDb.createObjectStore(objectStoreName);
        });
        dbPromise.then(function (db) {
            // opening db transaction
            let tx = db.transaction(objectStoreName, 'readwrite');
            let reviewStore = tx.objectStore(objectStoreName);

            reviewStore.put(reviewData, new Date());

        });
    }


}