// ===== CONFIG =====
mapboxgl.accessToken = "pk.eyJ1IjoiYWZpZmFoMjEiLCJhIjoiY21xeWgxaGt3MDFpazJwb2NjaGp4aGFocyJ9.Yw39BSS5qsW5lxZ7jk84_w";

const SHEET_API =
  "https://script.google.com/macros/s/AKfycbxKjwgmb4wL8XvelOq3tEIdh62nCgECfjhGgQoAU2T8EFkF0rEFZU-E1VQkmtNifs7b/exec";


// ===== CREATE MAP =====
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [101.6869, 3.1390],
  zoom: 9
});

map.addControl(new mapboxgl.NavigationControl());


// ===== ELEMENTS =====
const storeList = document.getElementById("storeList");
const storeSearch = document.getElementById("storeSearch");

let allStores = [];
let markers = [];


// ===============================
// LOAD STORE DATA
// ===============================

fetch(SHEET_API)
  .then(res => res.json())
  .then(stores => {

    // Only keep stores with valid coordinates
    allStores = stores.filter(store => {

      const lng = parseFloat(store.Longitude);
      const lat = parseFloat(store.Latitude);

      return !isNaN(lat) && !isNaN(lng);
    });

    renderStores(allStores);

  })
  .catch(err => {
    console.error("Error loading store data:", err);

    storeList.innerHTML = `
      <div class="no-result">
        <h3>Unable to load stores</h3>
        <p>Please try again later.</p>
      </div>
    `;
  });


// ===============================
// RENDER STORES
// ===============================

function renderStores(stores) {

  // Clear old store cards
  storeList.innerHTML = "";


  // Remove old markers
  markers.forEach(marker => marker.remove());
  markers = [];


  // ===============================
  // NO RESULTS
  // ===============================

  if (stores.length === 0) {

    storeList.innerHTML = `
      <div class="no-result">
        <h3>No stores found</h3>
        <p>Try searching by store name or city.</p>
      </div>
    `;

    return;
  }


  // ===============================
  // BOUNDS
  // ===============================

  const bounds = new mapboxgl.LngLatBounds();


  // ===============================
  // CREATE STORES
  // ===============================

  stores.forEach(store => {

    const lng = parseFloat(store.Longitude);
    const lat = parseFloat(store.Latitude);

    if (isNaN(lat) || isNaN(lng)) return;

    bounds.extend([lng, lat]);


    // ===============================
    // POPUP
    // ===============================

    const popup = new mapboxgl.Popup({
      offset: 25
    }).setHTML(`
      <div style="min-width:220px">

        <h3>${store["Store Name"] || ""}</h3>

        <p>🏪 ${store.Retailer || ""}</p>

        <p>📍 ${store.Address || ""}</p>

        <p>🕒 ${store["Business Hours"] || ""}</p>

        <p>☎ ${store.Phone || ""}</p>

        <a
          href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Get Directions →
        </a>

      </div>
    `);


    // ===============================
    // MARKER
    // ===============================

    const marker = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    markers.push(marker);


    // ===============================
    // STORE CARD
    // ===============================

    const card = document.createElement("div");

    card.className = "store-card";

    card.innerHTML = `
      <h3>${store["Store Name"] || ""}</h3>

      <p>${store.Retailer || ""}</p>

      <p>${store.Address || ""}</p>

      <p>${store["Business Hours"] || ""}</p>
    `;


    // ===============================
    // CARD CLICK
    // ===============================

    card.addEventListener("click", () => {

      // Remove active state from all cards
      document.querySelectorAll(".store-card").forEach(c => {
        c.classList.remove("active");
      });

      // Active current card
      card.classList.add("active");


      // Move map to store
      map.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 800
      });


      // Open popup
      popup.addTo(map);

    });


    storeList.appendChild(card);

  });


  // ===============================
  // FIT MAP TO STORES
  // ===============================

  if (!bounds.isEmpty()) {

    // If only one store
    if (stores.length === 1) {

      const store = stores[0];

      const lng = parseFloat(store.Longitude);
      const lat = parseFloat(store.Latitude);

      map.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 800
      });

      if (markers[0]) {
        markers[0].togglePopup();
      }

    }

    // Multiple stores
    else {

      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 15
      });

    }

  }

}


// ===============================
// SEARCH STORE / CITY / AREA
// ===============================

storeSearch.addEventListener("input", function () {

  const keyword = this.value
    .trim()
    .toLowerCase();


  // ===============================
  // EMPTY SEARCH
  // ===============================

  if (keyword === "") {

    renderStores(allStores);

    return;
  }


  // ===============================
  // SEARCH ONLY WITHIN SHEET DATA
  // ===============================

  const filtered = allStores.filter(store => {

    const storeName =
      (store["Store Name"] || "").toLowerCase();

    const retailer =
      (store.Retailer || "").toLowerCase();

    const address =
      (store.Address || "").toLowerCase();


    return (
      storeName.includes(keyword) ||
      retailer.includes(keyword) ||
      address.includes(keyword)
    );

  });


  renderStores(filtered);

});