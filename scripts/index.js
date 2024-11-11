const LOCATION_NAME = document.getElementById('location-name');
const LOCATION_IMAGE = document.getElementById('location-image');
const CARDS_CONTAINER = document.getElementById('location-content');

const DETAILS_DIALOG = document.getElementById('details-modal');
const DETAILS_BACKDROP = document.getElementById('details-backdrop');

const FAVORITE_FILTER = document.getElementById('favorite-filter');
const OPEN_FILTER = document.getElementById('open-filter');
const LOCATION_FILTER = document.getElementById('location-filter');

const IMAGE_FOLDER = 'images/restaurants/';
const LOCATIONS_FOLDER = 'images/locations/';
const LOCATION_NAMES = {
    'all': 'All Locations',
    'd-hall': 'D-Hall',
    'dukes-dining': 'Dukes Dining',
    'east-campus': 'East Campus'
}

const CLOSING_SOON_THRESHOLD = 30;

let currDay;

let restaurantsFull;
let restaurants = [];
let restaurantsFiltered = [];

let selectedRestaurant;

// DETAILS_BACKDROP.addEventListener('click', (e) => {
//     closeDetails();
// })

window.addEventListener('click', (e) => {
    if (!!selectedRestaurant && e.target == document.documentElement) closeDetails();
});

const currentScript = document.currentScript;
window.onload = () => {
    let i = document.createElement('img');

    CARDS_CONTAINER.appendChild(i);
    fetch('storage/restaurants.json')
        .then(response => response.json())
        .then(json => {
            restaurantsFull = json;
            restaurants = {};
            Object.entries(json).forEach(([location, locationData]) => {
                let items = [...locationData];

                items.forEach(item => {
                    item.location = location;
                    restaurants[item.id] = item;
                });
            });

            loadRestaurants();
            resetFilters();

            let location = "";
            restaurantsFiltered = restaurants;

            generateCards();
        });
}

/* DATA HANDLING */

function getRestaurant(id) {
    // Input may be an ID or a restaurant object containing an ID
    if (!!id?.id) id = id;

    let restaurant = restaurants[id];
    return restaurant;
}

function editRestaurant(newData) {
    if (!newData?.id) return;

    let index = restaurants[newData.id];
    let oldData = restaurants[index];

    if (!!oldData) {
        restaurants[index] = newData;
    }
}

/* FILTERING FUNCTIONS */
function updateLocation() {
    let location = LOCATION_FILTER.value;
    if (!location || location == '') location = 'all';

    LOCATION_NAME.textContent = LOCATION_NAMES[location];
    LOCATION_IMAGE.src = LOCATIONS_FOLDER + location + '.jpg';
}

function filterRestaurants() {
    updateLocation();

    let filtered = Object.keys(restaurants).reduce((accumulator, key) => {
        let curr = restaurants[key];

        if (FAVORITE_FILTER.checked && !curr.isFavorited)
            return accumulator;

        if (OPEN_FILTER.checked && !curr.isOpen)
            return accumulator;

        if (!!LOCATION_FILTER.value && curr.location != LOCATION_FILTER.value)
            return accumulator;

        accumulator[curr.id] = curr;
        return accumulator;
    }, {});

    restaurantsFiltered = filtered;
    updateCards();
}

function resetFilters() {

    FAVORITE_FILTER.checked = false;
    OPEN_FILTER.checked = false;
    LOCATION_FILTER.value = "";

    restaurantsFiltered = restaurants;
    updateCards();
    updateLocation();
}

/* DOM MANIPULATION */
function updateCards() {
    let allCards = CARDS_CONTAINER.querySelectorAll('.card');

    console.log(restaurantsFiltered)
    allCards.forEach(card => {
        let id = card.id.slice(0, -5);
        console.log(id)

        console.log(restaurantsFiltered[id]);
        if (!!restaurantsFiltered[id]) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function generateCards() {
    if (restaurantsFiltered == undefined) return;

    currDay = new Date().getDay().toString();

    CARDS_CONTAINER.innerHTML = "";

    let restaurantsSorted = [...Object.values(restaurants)]
    restaurantsSorted = restaurantsSorted.sort((a, b) => {
        return a.name.localeCompare(b.name);
    });
    console.log(restaurantsSorted)
    restaurantsSorted.forEach((item, i) => {
        generateCard(item);
    });
}

function generateCard(data) {
    let oldElem = document.getElementById(`${data.id}-card`);

    if (data == undefined) data = restaurants[data.id];
    // let card = document.createElement('div');
    // card.classList.add('card');
    let cardTemplate = document.getElementById('card-template').cloneNode(true);

    let card = document.createElement('div');
    card.classList.add('card');
    card.tabIndex = 0;
    card.innerHTML = cardTemplate.innerHTML;
    card.id = `${data.id}-card`;

    /* Header */
    let title = card.querySelector('.card-name');
    title.textContent = data.name;
    // card.appendChild(header);
    /* ______ */

    /* Background Image */
    let image = card.querySelector('.card-image');
    image.src = IMAGE_FOLDER + data.id + '.jpg';
    /* ________________ */

    let favorite = card.querySelector('.card-options .favorite');
    if (!!data.isFavorited) favorite.classList.add('selected');
    favorite.innerHTML = !!data.isFavorited ? '&heartsuit;' : '&#9825;';

    favorite.addEventListener('click', (e) => {
        favoriteRestaurant(data.id);
        favorite.focus();
        e.stopPropagation();
    });

    /* Footer */
    let footer = card.querySelector('.card-footer');

    let hours = 'All Day';
    let open, close;
    let statusClass = 'closed';
    let status = 'CLOSED';
    let schedule = Object.keys(data.hours);
    for (let group of schedule) {
        let scheduleGroup = group.split(',');
        if (scheduleGroup.includes(currDay)) {
            let hoursArray = data.hours[scheduleGroup].split('-');

            open = stringToTime(hoursArray[0]);
            close = stringToTime(hoursArray[1]);

            let openFormatted = timeToString(open);
            let closeFormatted = timeToString(close);

            if (!!openFormatted && !!closeFormatted) {
                hours = openFormatted + '-' + closeFormatted;
            }

            data.isOpen = isOpen(open, close);
            if (data.isOpen && close - new Date() < Math.floor(CLOSING_SOON_THRESHOLD * 1000 * 60)) {
                status = 'CLOSING SOON';
                statusClass = 'closing';
            } else {
                status = data.isOpen ? 'OPEN' : 'CLOSED';
                statusClass = status.toLowerCase();
            }
        }
    }

    let hoursText = card.querySelector('.hours');
    hoursText.classList.add('hours');
    hoursText.textContent = hours;

    let statusText = card.querySelector('.status');
    // statusText.classList.add('status');
    statusText.textContent = status;
    statusText.className = 'status';
    statusText.classList.add(statusClass);

    // footer.appendChild(statusText);
    // footer.appendChild(hoursText);
    // card.appendChild(footer);
    /* ______ */

    card.addEventListener('click', () => openDetails(data.id));

    if (!!oldElem) {
        oldElem.replaceWith(card);
    } else {
        CARDS_CONTAINER.appendChild(card);
    }
}

/* UTILITY FUNCTIONS */

// Convert a string with format "hh:mm" to a datetime
function stringToTime(time) {
    if (time == undefined || time.split(':').length != 2) return null;

    let hours = parseInt(time.substr(0,time.indexOf(":")));
    let minutes = parseInt(time.substr(time.indexOf(":")+1));

    // Ensure hours and minutes are within proper ranges
    if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
        return null;
    }

    let date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);

    return date;
}

// Convert a string with format "hh:mm[am/pm]"
function timeToString(date) {
    if (date == undefined) return '';

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let period = hours < 12 ? 'am' : 'pm';

    if (hours <= 0) hours = 12;
    else if (hours > 12) hours = hours % 12;

    return hours.toString() + ':' + minutes.toString().padStart(2, '0') + period;
}

function isOpen(open, close) {
    let date = new Date();

    return open < date && close > date;
}

/* MODAL FUNCTIONS */

function openDetails(id) {
    let restaurant = restaurants[id];
    if (!restaurant) return;

    selectedRestaurant = restaurant;

    document.getElementById('details-name').textContent = restaurant.name;
    document.getElementById('details-address').textContent = restaurant.address;
    document.getElementById('details-address').href = "https://www.google.com/maps/search/?api=1&query=" + restaurant.address;
    if (!restaurant.address)
        document.getElementById('details-address-icon').style.display = 'none';
    else
        document.getElementById('details-address-icon').style.display = 'block';

    document.getElementById('details-content').innerHTML = restaurant.description;

    DETAILS_DIALOG.classList.add('open');
    DETAILS_BACKDROP.classList.add('open');
    DETAILS_DIALOG.showModal();
}

function closeDetails() {
    selectedRestaurant = null;
    DETAILS_DIALOG.classList.remove('open');
    DETAILS_BACKDROP.classList.remove('open');
    DETAILS_DIALOG.close();
}

function favoriteRestaurant(id, isFavorited) {
    let card = restaurants[id];

    if (isFavorited == undefined) isFavorited = !card.isFavorited;
    card.isFavorited = isFavorited;

    editRestaurant(card);
    saveRestaurants();

    generateCard(card);
}


/* LOCAL STORAGE FUNCTIONS */

function saveRestaurants() {
    let existingData = JSON.parse(localStorage.getItem('restaurants')) ?? {};

    Object.values(restaurants).forEach(restaurant => {
        let newData = existingData[restaurant.id] ?? {};

        if (restaurant.isFavorited || newData.isFavorited)
            newData.isFavorited = restaurant.isFavorited;

        // Save restaurant data only if there is anything to save
        if (Object.keys(newData).length > 0) existingData[restaurant.id] = newData;
    });

    localStorage.setItem('restaurants', JSON.stringify(existingData));
}

function loadRestaurants() {
    let existingData = JSON.parse(localStorage.getItem('restaurants')) ?? {};

    Object.values(restaurants).forEach(restaurant => {
        restaurant.isFavorited = existingData?.[restaurant.id]?.isFavorited ?? false;
    });
}
