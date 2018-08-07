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
                '/css/styles.css',
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
            ]).then(function (whatever) { // Dear Udacity Code Revier - is there a more elegant way of handling this?

                var GoogleApis = [
                    /* GoogleMaps work around due to cors */
                    'https://maps.googleapis.com/maps/api/js?key=AIzaSyD4a_ueS5SnQE4zVjQYl4e3Leenf6glnZA&libraries=places&callback=initMap',

                    //These seem to be irrelevant but  I wonder why.... Can you help Udacity Examiner?
                    'https://maps.googleapis.com/maps-api-v3/api/js/33/4/common.js',
                    'https://maps.googleapis.com/maps-api-v3/api/js/33/4/util.js',
                    'https://maps.googleapis.com/maps-api-v3/api/js/33/4/map.js',
                    'https://maps.gstatic.com/mapfiles/openhand_8_8.cur',
                    'https://maps.googleapis.com/maps-api-v3/api/js/33/4/onion.js',
                    'https://maps.googleapis.com/maps/api/js/ViewportInfoService.GetViewportInfo?1m6&1m2&1d40.55965355640603&2d-74.43742423284988&2m2&1d40.88229899141979&2d-73.53193543135967&2u12&4sen-US&5e0&6sm%40426000000&7b0&8e0&callback=_xdc_._ylf19y&token=119756',
                    'https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i12!2i1206!3i1540!4i256!2m3!1e0!2sm!3i426128360!3m9!2sen-US!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!4e0!23i1301875&token=29193',
                    'https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i12!2i1205!3i1540!4i256!2m3!1e0!2sm!3i426128360!3m9!2sen-US!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!4e0!23i1301875&token=51358',
                    'https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i12!2i1205!3i1539!4i256!2m3!1e0!2sm!3i426128360!3m9!2sen-US!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!4e0!23i1301875&token=16711',
                    'https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i12!2i1206!3i1539!4i256!2m3!1e0!2sm!3i426128360!3m9!2sen-US!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!4e0!23i1301875&token=125617',
                    'https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i12!2i1207!3i1539!4i256!2m3!1e0!2sm!3i426128360!3m9!2sen-US!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!4e0!23i1301875&token=103452',
                    'https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i12!2i1207!3i1540!4i256!2m3!1e0!2sm!3i426128360!3m9!2sen-US!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!4e0!23i1301875&token=7028',
                    'https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i12!2i1204!3i1540!4i256!2m3!1e0!2sm!3i426128360!3m9!2sen-US!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!4e0!23i1301875&token=73523',
                    'https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i12!2i1204!3i1539!4i256!2m3!1e0!2sm!3i426128360!3m9!2sen-US!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!4e0!23i1301875&token=38876',
                    'https://maps.googleapis.com/maps/vt?pb=!1m4!1m3!1i12!2i1204!3i1539!1m4!1m3!1i12!2i1205!3i1539!1m4!1m3!1i12!2i1206!3i1539!1m4!1m3!1i12!2i1207!3i1539!1m4!1m3!1i12!2i1204!3i1540!1m4!1m3!1i12!2i1205!3i1540!1m4!1m3!1i12!2i1206!3i1540!1m4!1m3!1i12!2i1207!3i1540!2m3!1e0!2sm!3i426128360!3m9!2sen-US!3sUS!5e18!12m1!1e68!12m3!1e37!2m1!1ssmartmaps!4e3!12m1!5b1!23i1301875&callback=_xdc_._q605ay&token=53186',
                    'https://maps.googleapis.com/maps-api-v3/api/js/33/4/marker.js',
                    'https://maps.gstatic.com/mapfiles/transparent.png',
                    'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png',
                    'https://maps.googleapis.com/maps-api-v3/api/js/33/4/controls.js',
                    'https://maps.googleapis.com/maps/api/js/AuthenticationService.Authenticate?1shttp%3A%2F%2Flocalhost%3A8000%2F&4sAIzaSyD4a_ueS5SnQE4zVjQYl4e3Leenf6glnZA&callback=_xdc_._z2iugc&token=86081',
                    'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
                    'https://maps.gstatic.com/mapfiles/api-3/images/google4.png',
                    'https://maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png',
                    'https://maps.gstatic.com/mapfiles/api-3/images/sv9.png',
                    'https://maps.googleapis.com/maps/api/js/QuotaService.RecordEvent?1shttp%3A%2F%2Flocalhost%3A8000%2F&3sAIzaSyD4a_ueS5SnQE4zVjQYl4e3Leenf6glnZA&7sslx6ya&10e1&callback=_xdc_._clutb4&token=111036',
                    'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
                    'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2',
                    'https://maps.gstatic.com/mapfiles/api-3/images/tmapctrl.png',
                    'https://maps.gstatic.com/mapfiles/api-3/images/cb_scout5.png',
                    'https://maps.gstatic.com/mapfiles/api-3/images/tmapctrl4.png',
                    'https://maps.gstatic.com/mapfiles/mv/imgs8.png',
                    'https://maps.googleapis.com/maps-api-v3/api/js/33/4/stats.js'


                ];

                for (url in GoogleApis) {
                    // The google maps related item come from a different origin and have to be stored differently
                    caches.open('OpaqueCache').then(function (cache) {
                        fetch(url, {
                            mode: 'no-cors'
                        }).then(function (response) {
                            //opague cached something');
                            return cache.put(url, response);
                        });
                    }).catch(function (e) {
                            console.log('failed to cache api');
                            console.log(e);
                        }
                    );
                }
            });

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
        console.log('in sendREview in sw.js');
        event.waitUntil(DBHelper.submitReviewsSavedUntilOnline());
    }
});

