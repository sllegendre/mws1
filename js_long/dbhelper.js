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
            //console.log("failed...reason is");
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
     * Fetch Reviews for one restaurant
     */
    static fetchReviewsForRestaurant(reviewsEndpoint, restaurantID, callback) {

        let objectStoreName = "reviewsStore";

        // open database
        let dbPromise = idb.open('reviewsDB', 1, function (upgradeDb) {
            let restaurantsStore = upgradeDb.createObjectStore(objectStoreName, {keyPath: 'id'});
        });

        dbPromise.then(function (db) {

            // Try to get the restaurant specific reviews
            let endpointForRest = reviewsEndpoint + "?restaurant_id=" + restaurantID;
            // calling... endpointForRest

            // fetch json from server
            fetch(endpointForRest).then(response => response.json()).then(function (reviewsData) {

                // opening db transaction
                let tx = db.transaction(objectStoreName, 'readwrite');
                let reviewStore = tx.objectStore(objectStoreName);

                // Adding each review to the DB
                reviewsData.forEach(review => {
                    reviewStore.put(review).catch(reason => console.log(reason));
                });

                callback(reviewsData);

            }).catch(function (reason) {
                console.log(reason);

                // opening db transaction
                let tx = db.transaction(objectStoreName, 'readonly');
                let reviewStore = tx.objectStore(objectStoreName);

                // Use stale reviews from the DB if possible
                reviewStore.getAll().then(function (reviewsFromDB) {

                    callback(reviewsFromDB);

                }).catch(function (reason) {
                    console.log(reason);
                    callback(false);
                });


            });
        });
    };

    /**
     * Submit review
     */
    static submitReviewsSavedUntilOnline() {
        // it should now post start to submit saved reviews from the time when offline...

        let objectStoreName = "laterStore";

        let dbPromise = idb.open('postLaterDB', 1, function (upgradeDb) {
            let laterStore = upgradeDb.createObjectStore(objectStoreName);
        });
        dbPromise.then(function (db) {
            // opening db transaction
            let tx = db.transaction(objectStoreName, 'readwrite');
            let laterStore = tx.objectStore(objectStoreName);
            // getting stuff out of the store...hopefully
            let toDelete = [];

            laterStore.getAll().then(function (allToPost) {
                // could get summin to post

                allToPost.forEach(async function (reviewData) {
                    // just before post
                    await fetch("http://localhost:1337/reviews/", {
                        method: 'post',
                        body: reviewData,
                    }).then(response => response.json()).then(function (resp) {

                        toDelete.push(reviewData.comments);
                    }).catch(function () {
                        console.log("could still not post...");
                    });

                    toDelete.forEach(function (key) {
                        let tx = db.transaction(objectStoreName, 'readwrite');
                        let laterStore = tx.objectStore(objectStoreName);
                        laterStore.delete(key).then(val => console.log("")).catch("not deleted...");
                    });

                });
            }).catch(reason => console.log('nothing from store to post now...'));


        });

        dbPromise.catch(reason => console.log("could not open db..."));


    };


    static uploadReviewLaterFromDB(reviewData) {

        let objectStoreName = "laterStore";
        // Save the badboy locally to post later
        let dbPromise = idb.open('postLaterDB', 1, function (upgradeDb) {
            let laterStore = upgradeDb.createObjectStore(objectStoreName);
        });
        dbPromise.then(function (db) {
            // opening db transaction
            let tx = db.transaction(objectStoreName, 'readwrite');
            let reviewStore = tx.objectStore(objectStoreName);

            reviewStore.put(reviewData, reviewData.comments);

        });

        dbPromise.catch(reason => {
            console.log(reason);
            console.log("this should not happen...");
        });
    }

    static putReviewInNormalDB(reviewData) {
        let objectStoreName = "reviewsStore";
        // Save the badboy locally to post later
        let dbPromise = idb.open('reviewsDB', 1, function (upgradeDb) {
            let reviewsStore = upgradeDb.createObjectStore(objectStoreName);
        });

        dbPromise.then(function (db) {

            console.log("should add to normal db...");
            // opening db transaction
            let tx = db.transaction(objectStoreName, 'readwrite');
            let reviewsStore = tx.objectStore(objectStoreName);

            reviewsStore.put(reviewData);

        });

    }


}
