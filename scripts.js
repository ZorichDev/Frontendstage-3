// DOM Elements
const searchInput = document.getElementById("searchInput");
const suggestionsList = document.getElementById("suggestions");
const priceDisplay = document.getElementById("priceDisplay");
const assetName = document.getElementById("assetName");
const assetPrice = document.getElementById("assetPrice");
const assetChange = document.getElementById("assetChange");
const assetMarketCap = document.getElementById("assetMarketCap");
const assetVolume = document.getElementById("assetVolume");
const darkModeToggle = document.getElementById("darkModeToggle");
const priceChartCanvas = document.getElementById("priceChart").getContext("2d");

// Currency Dropdown
const currencyDropdown = document.getElementById("currencyDropdown");
const currencyItems = document.querySelectorAll(".dropdown-item");

let selectedCurrency = "USD"; // Default currency

// Default Asset
const defaultAssetId = "bitcoin"; // Default asset ID (Bitcoin)
const defaultAssetType = "crypto"; // Default asset type (crypto)

// Track the currently selected asset
let currentAssetId = defaultAssetId;
let currentAssetType = defaultAssetType;

// Chart Initialization
let priceChart = new Chart(priceChartCanvas, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Price",
        data: [],
        borderColor: "red", // Red line
        backgroundColor: "rgba(255, 0, 0, 0.1)", // Light red fill
        fill: false,
        tension: 0.4, // Smooth line
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
          color: "black", // Black text for axis
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)", // Light black grid lines
        },
        ticks: {
          color: "black", // Black text for ticks
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Price (USD)",
          color: "black", // Black text for axis
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)", // Light black grid lines
        },
        ticks: {
          color: "black", // Black text for ticks
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "black", // Black text for legend
        },
      },
    },
  },
});

// Update Chart
function updateChart(labels, prices) {
  priceChart.data.labels = labels;
  priceChart.data.datasets[0].data = prices;
  priceChart.update();
}

// Fetch Suggestions
searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  if (query.length > 2) {
    try {
      const cryptoResponse = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${query}`
      );
      const cryptoData = await cryptoResponse.json();
      const stockResponse = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=YOUR_ALPHA_VANTAGE_API_KEY`
      );
      const stockData = await stockResponse.json();
      const suggestions = [
        ...cryptoData.coins.map((coin) => ({
          id: coin.id,
          name: coin.name,
          type: "crypto",
        })),
        ...stockData.bestMatches.map((stock) => ({
          id: stock["1. symbol"],
          name: stock["2. name"],
          type: "stock",
        })),
      ];
      displaySuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  } else {
    suggestionsList.style.display = "none";
  }
});

// Display Suggestions
function displaySuggestions(suggestions) {
  suggestionsList.innerHTML = suggestions
    .map(
      (item) =>
        `<li class="list-group-item" data-id="${item.id}" data-type="${item.type}">${item.name}</li>`
    )
    .join("");
  suggestionsList.style.display = "block";
}

// Handle Suggestion Click
suggestionsList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    const id = e.target.getAttribute("data-id");
    const type = e.target.getAttribute("data-type");
    searchInput.value = e.target.textContent;
    suggestionsList.style.display = "none";
    fetchAssetData(id, type);
  }
});

// Fetch Asset Data
async function fetchAssetData(id, type) {
  currentAssetId = id; // Update the currently selected asset ID
  currentAssetType = type; // Update the currently selected asset type

  let data;
  try {
    if (type === "crypto") {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}`
      );
      data = await response.json();
    } else if (type === "stock") {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${id}&apikey=YOUR_ALPHA_VANTAGE_API_KEY`
      );
      const responseData = await response.json();
      data = responseData["Global Quote"];
    }
    updatePriceDisplay(data);
    fetchChartData(id, type);
  } catch (error) {
    console.error("Error fetching asset data:", error);
  }
}

// Update Price Display
function updatePriceDisplay(data) {
  if (data) {
    const price = data.market_data?.current_price?.[selectedCurrency.toLowerCase()] || data["05. price"];
    const marketCap = data.market_data?.market_cap?.[selectedCurrency.toLowerCase()] || "N/A";
    const volume = data.market_data?.total_volume?.[selectedCurrency.toLowerCase()] || data["06. volume"];
    assetName.textContent = data.name || data["01. symbol"];
    assetPrice.textContent = `Price: ${selectedCurrency} ${price}`;
    assetChange.textContent = `24h Change: ${data.market_data?.price_change_percentage_24h || data["10. change percent"]}`;
    assetMarketCap.textContent = `Market Cap: ${selectedCurrency} ${marketCap}`;
    assetVolume.textContent = `Volume: ${selectedCurrency} ${volume}`;
  } else {
    assetName.textContent = "Asset Name";
    assetPrice.textContent = `Price: ${selectedCurrency} 0.00`;
    assetChange.textContent = "24h Change: 0.00%";
    assetMarketCap.textContent = `Market Cap: ${selectedCurrency} 0.00`;
    assetVolume.textContent = `Volume: ${selectedCurrency} 0.00`;
  }
}

// Fetch Chart Data
async function fetchChartData(id, type) {
  let labels, prices;
  if (type === "crypto") {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${selectedCurrency.toLowerCase()}&days=7`
    );
    const data = await response.json();
    labels = data.prices.map((price) => new Date(price[0]).toLocaleDateString());
    prices = data.prices.map((price) => price[1]);
  } else if (type === "stock") {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${id}&apikey=YOUR_ALPHA_VANTAGE_API_KEY`
    );
    const data = await response.json();
    const timeSeries = data["Time Series (Daily)"];
    labels = Object.keys(timeSeries).reverse();
    prices = Object.values(timeSeries).map((day) => day["4. close"]);
  }
  updateChart(labels, prices);
}

// Currency Dropdown Event Listeners
currencyItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    selectedCurrency = e.target.getAttribute("data-currency");
    currencyDropdown.textContent = selectedCurrency;

    // Re-fetch data for the currently selected asset
    if (currentAssetId && currentAssetType) {
      fetchAssetData(currentAssetId, currentAssetType);
    }
  });
});

// Dark Mode Toggle
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Fetch data for the default asset when the page loads
document.addEventListener("DOMContentLoaded", () => {
  fetchAssetData(defaultAssetId, defaultAssetType);
});