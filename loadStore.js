// loadStore.js

import { discogsApiHeaders } from './apiConfig.js';

// Global variables
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

    // Reset all global variables for the new store
    currentStoreName = resellerName;
    listingsListenedTo = [];
    pagesScanned = ['1']; // Start with page 1
    listingDetails = [];
    totalPages = 1;

    console.log(`Fetching catalog for store: ${resellerName}`);

    fetch(`https://api.discogs.com/users/${resellerName}/inventory?page=1&per_page=100&sort=listed&sort_order=desc`, {
        headers: discogsApiHeaders
    })
        .then(response => response.json())
        .then(data => {
            console.log("Data received from Discogs API");

            // Store the total number of pages
            totalPages = data.pagination.pages;
            console.log(`Total pages available: ${totalPages}`);

            data.listings.forEach(listing => {
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
            });

            console.log("Listing details stored:", listingDetails);
        })
        .catch(error => console.error("Error fetching data from Discogs API:", error));
}
