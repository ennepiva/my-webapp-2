import { discogsApiHeaders } from './apiConfig.js';
import { listingDetails, listingsListenedTo, pagesScanned, currentStoreName, totalPages } from './loadStore.js';
import { playTrack, getTotalTracks, nextTrackHandler } from './videoSelector.js';

let nextRecordCount = 0;
let recordHistory = [];
let currentRecordIndex = -1;
let currentVideoIndex = 0;

export function nextRecord() {
    if (listingDetails.length === 0) {
        console.log("No listings available.");
        return;
    }
    let randomListingIndex;
    do {
        randomListingIndex = Math.floor(Math.random() * listingDetails.length);
    } while (listingsListenedTo.includes(listingDetails[randomListingIndex].listing_id));
    listingsListenedTo.push(listingDetails[randomListingIndex].listing_id);
    recordHistory.push(randomListingIndex);
    currentRecordIndex = recordHistory.length - 1;
    displayListingInfo(listingDetails[randomListingIndex]);
    const releaseId = listingDetails[randomListingIndex].release_id;
    fetch(`https://api.discogs.com/releases/${releaseId}`, {
        headers: discogsApiHeaders
    })
    .then(response => response.json())
    .then(data => {
        console.log("Fetched release details:", data);
        listingDetails[randomListingIndex].release_videos = data.videos || [];
        listingDetails[randomListingIndex].tracklist = data.tracklist || [];
        listingDetails[randomListingIndex].release_year = data.year || null;
        currentVideoIndex = 0;
        playTrack(listingDetails[randomListingIndex], currentVideoIndex);
        displayListingInfo(listingDetails[randomListingIndex]);
    })
    .catch(error => console.error("Error fetching release details:", error));
    nextRecordCount++;
    if (nextRecordCount % 6 === 0) {
        fetchRandomPage();
    }
}

export function prevRecord() {
    if (currentRecordIndex <= 0) {
        console.log("No previous records to show.");
        return;
    }
    currentRecordIndex--;
    const previousListingIndex = recordHistory[currentRecordIndex];
    const previousListing = listingDetails[previousListingIndex];
    displayListingInfo(previousListing);
    currentVideoIndex = 0;
    playTrack(previousListing, currentVideoIndex);
}

export function nextTrack() {
    if (currentRecordIndex < 0 || currentRecordIndex >= recordHistory.length) {
        console.log("No record selected.");
        return;
    }
    nextTrackHandler();
}

function displayListingInfo(listing) {
    const listingInfo = document.getElementById('listingInfo');
    listingInfo.innerHTML = `
        <a href="${listing.listing_uri}" target="_blank">${listing.release_description || 'No description available'}</a>
        <p>Released: ${listing.release_year || 'Unknown'} | Price: ${listing.listing_price}</p>
        <p>Condition: ${listing.listing_condition} | Sleeve: ${listing.sleeve_condition}</p>
    `;
}

function fetchRandomPage() {
    const maxPages = Math.min(totalPages, 200);
    if (pagesScanned.length >= maxPages) {
        console.log("All pages have been scanned. No further API calls will be made.");
        return;
    }
    let randomPage;
    do {
        randomPage = Math.floor(Math.random() * maxPages) + 1;
    } while (pagesScanned.includes(randomPage.toString()));
    pagesScanned.push(randomPage.toString());
    console.log(`Fetching new random page: ${randomPage}`);
    let pageToFetch = randomPage;
    let sortOrder = 'desc';
    if (totalPages > 200 && randomPage > 100) {
        pageToFetch = 200 - randomPage;
        sortOrder = 'asc';
    } else if (totalPages <= 200 && randomPage > Math.floor(totalPages / 2)) {
        pageToFetch = totalPages - randomPage;
        sortOrder = 'asc';
    }
    fetch(`https://api.discogs.com/users/${currentStoreName}/inventory?page=${pageToFetch}&per_page=100&sort=listed&sort_order=${sortOrder}`, {
        headers: discogsApiHeaders
    })
        .then(response => response.json())
        .then(data => {
            console.log(`Page ${randomPage} (fetched as page ${pageToFetch} with sort ${sortOrder}) received from Discogs API`);
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
            console.log("Updated listing details array with new listings:", listingDetails);
        })
        .catch(error => console.error("Error fetching new page from Discogs API:", error));
}
