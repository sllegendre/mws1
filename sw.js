importScripts('js/dbhelper.js');
importScripts('js/idb.js');


/*
Upon installation of the service worker, cache everything, so we can serce it in case there is no internet connectivity
*/
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('restaurants-static-v0').then(function (cache) {
            //am now caching stuff...
            cache.addAll([
                // These can be cached with addAll, because atomicity won't hurt (I expect all to go through)
                '/',
                //'/css/old_styles.css',
                '/css/main.css',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/IndexController.js',
                '/js/restaurant_info.js',
                '/js/idb.js',
                '/img/1.jpg',
                '/img/2.jpg',
                '/img/3.jpg',
                '/img/4.jpg',
                '/img/5.jpg',
                '/img/6.jpg',
                '/img/7.jpg',
                '/img/8.jpg',
                '/img/9.jpg',
                '/img/10.jpg',
                '/index.html',
                '/restaurant.html',
                '/restaurant.html?id=1',
                '/restaurant.html?id=2',
                '/restaurant.html?id=3',
                '/restaurant.html?id=4',
                '/restaurant.html?id=5',
                '/restaurant.html?id=6',
                '/restaurant.html?id=7',
                '/restaurant.html?id=8',
                '/restaurant.html?id=9',
                '/restaurant.html?id=10',
            ]);
        }));
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            // Going through all caches because of the opague no-cors responses...
            if (response) {
                // returning from cache...
                return response;
            } else {
                // Did not find in cache... fetching
                return fetch(event.request).then(function (resp) {
                    if (resp.status == 404) {
                        //return new Response("404, bummer...");
                        console.log("404 4: " + event.request.toString());
                    }
                    return resp;
                }).catch(function () {
                    console.log("this is sugar: ");
                    //return new Response("You seem to be off the line... ");
                });
            }
        }));
});


self.addEventListener('sync', function (event) {

    if (event.tag == 'sendReview') {
        console.log('Service Worker should learn he has to upload the review that did not go through...');
        event.waitUntil(DBHelper.submitReviewsSavedUntilOnline());
    }
});

