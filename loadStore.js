import { discogsApiHeaders } from './apiConfig.js';

export let currentStoreName = '';
export let listingsListenedTo = [];
export let pagesScanned = [];
export let listingDetails = [];
export let totalPages = 1;

export function loadStore(resellerName) {
    console.log("Load button pressed");

    if (!resellerName.trim()) {
        console.log("No store name entered. Exiting.");
        return;
    }

    if (resellerName === currentStoreName) {
        console.log("Store name is the same as the current one. Exiting.");
        return;
    }

    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = "0%";
    const randomSplit = Math.floor(Math.random() * (55 - 25 + 1)) + 25;
    setTimeout(() => {
        progressBar.style.transition = "width 1s linear";
        progressBar.style.width = `${randomSplit}%`;
    }, 10);

    currentStoreName = resellerName;
    listingsListenedTo = [];
    pagesScanned = ['1'];
    listingDetails = [];
    totalPages = 1;

    console.log(`Fetching catalog for store: ${resellerName}`);

    fetch(`https://api.discogs.com/users/${resellerName}/inventory?page=1&per_page=100&sort=listed&sort_order=desc`, {
        headers: discogsApiHeaders
    })
    .then(response => response.json())
    .then(data => {
        console.log("Data received from Discogs API");

        totalPages = data.pagination.pages;
        console.log(`Total pages available: ${totalPages}`);

        let loadedListings = 0;
        const totalListings = data.listings.length;

        data.listings.forEach((listing, index) => {
            setTimeout(() => {
                const formattedPrice = `${listing.price.value} ${listing.price.currency}`;
                listingDetails.push({
                    listing_id: listing.id,
                    listing_price: formattedPrice,
                    listing_uri: listing.uri,
                    listing_condition: listing.condition,
                    sleeve_condition: listing.sleeve_condition,
                    release_id: listing.release.id,
                    release_description: listing.release.description,
                    release_videos: null,
                    release_tracklist: null,
                    release_artists: null,
                    release_year: null
                });

                loadedListings++;
                progressBar.style.width = `${randomSplit + (loadedListings / totalListings) * (100 - randomSplit)}%`;
            }, index * 10);
        });

        console.log("Listing details stored:", listingDetails);
    })
    .catch(error => console.error("Error fetching data from Discogs API:", error));
}
