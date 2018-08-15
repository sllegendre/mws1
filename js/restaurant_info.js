let restaurant;var map;let reviewsEndpoint="http://localhost:1337/reviews/",favoritesEndpoint="";async function fillReviewsHTML(e){const t=document.getElementById("reviews-container"),n=document.getElementById("submit-review");if(await checkIfElemPresent("reviews-header")){document.getElementById("reviews-header").innerHTML="Reviews"}else{const e=document.createElement("h2");e.id="reviews-header",e.innerHTML="Reviews",t.insertBefore(e,n)}if(e){const n=document.getElementById("reviews-list");e.forEach(e=>{e.restaurant_id==self.restaurant.id&&n.appendChild(createReviewHTML(e))}),t.appendChild(n)}else{const e=document.createElement("p");e.innerHTML="No reviews yet!",t.appendChild(e)}}window.addEventListener("online",function(e){DBHelper.submitReviewsSavedUntilOnline()},!1),window.initMap=(()=>{fetchRestaurantFromURL((e,t)=>{e?console.error(e):(self.map=new google.maps.Map(document.getElementById("map"),{zoom:16,center:t.latlng,scrollwheel:!1}),fillBreadcrumb(),DBHelper.mapMarkerForRestaurant(self.restaurant,self.map))})}),fetchRestaurantFromURL=(e=>{if(self.restaurant)return void e(null,self.restaurant);const t=getParameterByName("id");t?DBHelper.fetchRestaurantById(t,(t,n)=>{self.restaurant=n,n?(fillRestaurantHTML(),e(null,n)):console.error(t)}):(error="No restaurant id in URL",e(error,null))}),fillRestaurantHTML=((e=self.restaurant)=>{document.getElementById("restaurant-name").innerHTML=e.name,document.getElementById("restaurant-address").innerHTML=e.address;const t=document.getElementById("restaurant-img");t.className="restaurant-img",t.src=DBHelper.imageUrlForRestaurant(e),t.alt="This is an image of the "+e.name.toString()+" restaurant.",document.getElementById("restaurant-cuisine").innerHTML=e.cuisine_type,e.operating_hours&&fillRestaurantHoursHTML(),DBHelper.fetchReviewsForRestaurant(reviewsEndpoint,self.restaurant.id,fillReviewsHTML)}),fillRestaurantHoursHTML=((e=self.restaurant.operating_hours)=>{const t=document.getElementById("restaurant-hours");for(let n in e){const r=document.createElement("tr"),a=document.createElement("td");a.innerHTML=n,r.appendChild(a);const i=document.createElement("td");i.innerHTML=e[n],r.appendChild(i),t.appendChild(r)}setFav()}),checkIfElemPresent=(e=>{try{return document.getElementById(e)}catch(e){return console.log(e),!1}}),createReviewHTML=(e=>{const t=document.createElement("li"),n=document.createElement("p");n.innerHTML=e.name,n.className="review-element",t.appendChild(n);const r=document.createElement("p");r.innerHTML=e.createdAt,t.appendChild(r);const a=document.createElement("p");a.innerHTML=`Rating: ${e.rating}`,t.appendChild(a);const i=document.createElement("p");return i.className="review-element",i.innerHTML=e.comments,t.appendChild(i),t}),fillBreadcrumb=((e=self.restaurant)=>{const t=document.getElementById("breadcrumb");if(t.childElementCount<2){const n=document.createElement("li");n.innerHTML=e.name,t.appendChild(n)}}),getParameterByName=((e,t)=>{t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");const n=new RegExp(`[?&]${e}(=([^&#]*)|&|#|$)`).exec(t);return n?n[2]?decodeURIComponent(n[2].replace(/\+/g," ")):"":null});let submitReview=function(){let e=document.forms["submit-review"];reviewData={restaurant_id:self.restaurant.id,name:e["review-name"].value,rating:e["review-rating"].value,comments:e["review-comments"].value};const t=document.getElementById("reviews-list");t.insertBefore(createReviewHTML(reviewData),t.firstChild);let n=fetch(reviewsEndpoint,{method:"POST",body:JSON.stringify(reviewData)});return n.then(e=>e.json()).then(function(t){console.log(t),DBHelper.putReviewInNormalDB(t),e.reset()}),n.catch(function(e){console.log("does not go through save it in a db and register a sync event"),console.log(e),DBHelper.uploadReviewLaterFromDB(reviewData)}),!1};function insertAfter(e,t){t.parentNode.insertBefore(e,t.nextSibling)}toggleFav=(()=>{fetch(favoritesEndpoint,{method:"put"}).then(e=>e.json()).then(function(e){self.restaurant=e,setFav()})}),setFav=(()=>{"true"==self.restaurant.is_favorite.toString()?self.restaurant.is_favorite=!0:self.restaurant.is_favorite=!1,setFavButton(self.restaurant.is_favorite),setFavoritURL(!self.restaurant.is_favorite)}),setFavoritURL=(e=>{let t="/"+window.location.href.split("=")[1]+"/?is_favorite=";favoritesEndpoint="http://localhost:1337/restaurants"+t+e}),setFavButton=(()=>{const e=document.getElementById("favorite-button");self.restaurant.is_favorite?e.innerText="unfavorite":e.innerText="favorite"});