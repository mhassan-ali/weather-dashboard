/* AeroWeather JavaScript Controller */

// State Management
const state = {
  currentCity: {
    name: 'London',
    country: 'United Kingdom',
    lat: 51.50735,
    lon: -0.12776
  },
  weatherData: null,
  aqiData: null,
  unit: 'C', // 'C' or 'F'
  theme: 'dark', // 'dark' or 'light'
  favorites: [], // Array of city objects
  recents: [] // Array of city objects, max 5
};

// LocalStorage Keys
const STORAGE_KEYS = {
  FAVORITES: 'aeroweather_favorites',
  RECENTS: 'aeroweather_recents',
  UNIT: 'aeroweather_unit',
  THEME: 'aeroweather_theme',
  LAST_CITY: 'aeroweather_last_city'
};

// WMO Weather Code Mapping (to Category & Descriptions)
const WEATHER_CODES = {
  0: { category: 'clear', desc: 'clear sky' },
  1: { category: 'clear', desc: 'mainly clear' },
  2: { category: 'cloudy', desc: 'partly cloudy' },
  3: { category: 'cloudy', desc: 'overcast' },
  45: { category: 'cloudy', desc: 'foggy' },
  48: { category: 'cloudy', desc: 'depositing rime fog' },
  51: { category: 'rainy', desc: 'light drizzle' },
  53: { category: 'rainy', desc: 'moderate drizzle' },
  55: { category: 'rainy', desc: 'dense drizzle' },
  56: { category: 'rainy', desc: 'light freezing drizzle' },
  57: { category: 'rainy', desc: 'dense freezing drizzle' },
  61: { category: 'rainy', desc: 'slight rain' },
  63: { category: 'rainy', desc: 'moderate rain' },
  65: { category: 'rainy', desc: 'heavy rain' },
  66: { category: 'rainy', desc: 'light freezing rain' },
  67: { category: 'rainy', desc: 'heavy freezing rain' },
  71: { category: 'snowy', desc: 'slight snow fall' },
  73: { category: 'snowy', desc: 'moderate snow fall' },
  75: { category: 'snowy', desc: 'heavy snow fall' },
  77: { category: 'snowy', desc: 'snow grains' },
  80: { category: 'rainy', desc: 'slight rain showers' },
  81: { category: 'rainy', desc: 'moderate rain showers' },
  82: { category: 'rainy', desc: 'violent rain showers' },
  85: { category: 'snowy', desc: 'slight snow showers' },
  86: { category: 'snowy', desc: 'heavy snow showers' },
  95: { category: 'stormy', desc: 'thunderstorm' },
  96: { category: 'stormy', desc: 'thunderstorm with slight hail' },
  99: { category: 'stormy', desc: 'thunderstorm with heavy hail' }
};

// Global variables for Chart and Map
let tempChartInstance = null;
let leafletMapInstance = null;
let mapMarkerInstance = null;
let searchDebounceTimeout = null;

// DOM Elements
const elements = {
  searchInput: document.getElementById('search-input'),
  clearSearch: document.getElementById('clear-search'),
  suggestionsList: document.getElementById('suggestions-list'),
  favoritesToggle: document.getElementById('favorites-toggle'),
  recentToggle: document.getElementById('recent-toggle'),
  unitToggle: document.getElementById('unit-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  favoritesPanel: document.getElementById('favorites-panel'),
  recentPanel: document.getElementById('recent-panel'),
  favoritesList: document.getElementById('favorites-list'),
  recentList: document.getElementById('recent-list'),
  closeFavorites: document.getElementById('close-favorites'),
  closeRecent: document.getElementById('close-recent'),
  
  loadingSpinner: document.getElementById('loading-spinner'),
  errorMessage: document.getElementById('error-message'),
  errorTitle: document.getElementById('error-title'),
  errorDesc: document.getElementById('error-desc'),
  closeError: document.getElementById('close-error'),
  
  appBg: document.getElementById('app-bg'),
  currentCityName: document.getElementById('current-city'),
  currentCountry: document.getElementById('current-country'),
  currentDate: document.getElementById('current-date'),
  favoriteBtn: document.getElementById('favorite-btn'),
  currentIconContainer: document.getElementById('current-icon-container'),
  currentTemp: document.getElementById('current-temp'),
  tempUnitLabel: document.getElementById('temp-unit'),
  currentCondition: document.getElementById('current-condition'),
  feelsLike: document.getElementById('feels-like'),
  tempMinMax: document.getElementById('temp-min-max'),
  
  aqiValue: document.getElementById('aqi-value'),
  aqiBadge: document.getElementById('aqi-badge'),
  pm25Val: document.getElementById('pm25-val'),
  no2Val: document.getElementById('no2-val'),
  
  windSpeed: document.getElementById('wind-speed'),
  windDirArrow: document.getElementById('wind-dir-arrow'),
  windDirText: document.getElementById('wind-dir-text'),
  
  humidityValue: document.getElementById('humidity-value'),
  humidityBarFill: document.getElementById('humidity-bar-fill'),
  humidityStatus: document.getElementById('humidity-status'),
  
  sunriseTime: document.getElementById('sunrise-time'),
  sunsetTime: document.getElementById('sunset-time'),
  
  mapCoords: document.getElementById('map-coords'),
  forecastContainer: document.getElementById('forecast-container'),
  weatherAlertBadge: document.getElementById('weather-alert-badge'),
  weatherAlertText: document.getElementById('weather-alert-text'),
  uvValue: document.getElementById('uv-value'),
  uvCategory: document.getElementById('uv-category'),
  uvBarFill: document.getElementById('uv-bar-fill'),
  visibilityValue: document.getElementById('visibility-value'),
  visibilityStatus: document.getElementById('visibility-status'),
  pressureValue: document.getElementById('pressure-value'),
  pressureStatus: document.getElementById('pressure-status'),
  precipProb: document.getElementById('precip-prob'),
  precipVolume: document.getElementById('precip-volume')
};

// Initialize Application
async function init() {
  loadLocalStorage();
  setupEventListeners();
  applyTheme();
  
  // Load initial city
  await fetchWeatherData(state.currentCity);
  
  // Render initial weather details
  renderWeatherDetails();
  
  // Initialize map and chart
  initMap(state.currentCity.lat, state.currentCity.lon);
  updateChart();
  
  // Lucide icon refresh
  lucide.createIcons();
}

// LocalStorage Handlers
function loadLocalStorage() {
  const storedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
  const storedRecents = localStorage.getItem(STORAGE_KEYS.RECENTS);
  const storedUnit = localStorage.getItem(STORAGE_KEYS.UNIT);
  const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  const storedLastCity = localStorage.getItem(STORAGE_KEYS.LAST_CITY);
  
  if (storedFavorites) state.favorites = JSON.parse(storedFavorites);
  if (storedRecents) state.recents = JSON.parse(storedRecents);
  if (storedUnit) state.unit = storedUnit;
  if (storedTheme) state.theme = storedTheme;
  if (storedLastCity) state.currentCity = JSON.parse(storedLastCity);
  
  updateFavoritesUI();
  updateRecentUI();
  updateUnitBtnUI();
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
  updateFavoritesUI();
}

function saveRecents() {
  localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(state.recents));
  updateRecentUI();
}

// Setup Event Listeners
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    applyTheme();
  });
  
  // Unit Toggle
  elements.unitToggle.addEventListener('click', () => {
    state.unit = state.unit === 'C' ? 'F' : 'C';
    localStorage.setItem(STORAGE_KEYS.UNIT, state.unit);
    updateUnitBtnUI();
    renderWeatherDetails();
    updateChart();
  });
  
  // Toggle Side Panels
  elements.favoritesToggle.addEventListener('click', () => {
    elements.favoritesPanel.classList.toggle('hidden');
    elements.recentPanel.classList.add('hidden');
  });
  
  elements.recentToggle.addEventListener('click', () => {
    elements.recentPanel.classList.toggle('hidden');
    elements.favoritesPanel.classList.add('hidden');
  });
  
  elements.closeFavorites.addEventListener('click', () => {
    elements.favoritesPanel.classList.add('hidden');
  });
  
  elements.closeRecent.addEventListener('click', () => {
    elements.recentPanel.classList.add('hidden');
  });
  
  // Favorite Button (Star) on Main Card
  elements.favoriteBtn.addEventListener('click', () => {
    toggleFavoriteCity(state.currentCity);
  });
  
  // Error Alert Close
  elements.closeError.addEventListener('click', () => {
    elements.errorMessage.classList.add('hidden');
  });
  
  // Search suggestion event handling
  elements.searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      elements.clearSearch.classList.remove('hidden');
    } else {
      elements.clearSearch.classList.add('hidden');
      elements.suggestionsList.classList.add('hidden');
    }
    
    // Debounce geocoding API
    clearTimeout(searchDebounceTimeout);
    if (query.length >= 2) {
      searchDebounceTimeout = setTimeout(() => {
        fetchGeocodingSuggestions(query);
      }, 400);
    } else {
      elements.suggestionsList.classList.add('hidden');
    }
  });
  
  elements.clearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.clearSearch.classList.add('hidden');
    elements.suggestionsList.classList.add('hidden');
    elements.searchInput.focus();
  });
  
  // Hide panels on clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.searchInput.contains(e.target) && !elements.suggestionsList.contains(e.target)) {
      elements.suggestionsList.classList.add('hidden');
    }
    if (!elements.favoritesToggle.contains(e.target) && !elements.favoritesPanel.contains(e.target)) {
      elements.favoritesPanel.classList.add('hidden');
    }
    if (!elements.recentToggle.contains(e.target) && !elements.recentPanel.contains(e.target)) {
      elements.recentPanel.classList.add('hidden');
    }
  });
}

// Apply theme to document
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const sunIcon = elements.themeToggle.querySelector('.theme-icon-light');
  const moonIcon = elements.themeToggle.querySelector('.theme-icon-dark');
  
  if (state.theme === 'light') {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
  
  // Force map layer repaint if map exists
  if (leafletMapInstance) {
    // We add and remove a tiny zoom to trigger a tile reload to apply the dark-mode CSS filter correctly
    leafletMapInstance.setZoom(leafletMapInstance.getZoom());
  }
  
  // Re-render chart to update grid/text color defaults
  updateChart();
}

// Unit button UI update
function updateUnitBtnUI() {
  elements.unitToggle.querySelector('span').textContent = `°${state.unit}`;
}

// Loading status handlers
function showLoading(show) {
  if (show) {
    elements.loadingSpinner.classList.remove('hidden');
  } else {
    elements.loadingSpinner.classList.add('hidden');
  }
}

function showError(title, desc) {
  elements.errorTitle.textContent = title;
  elements.errorDesc.textContent = desc;
  elements.errorMessage.classList.remove('hidden');
  
  // Auto-hide error after 6 seconds
  setTimeout(() => {
    elements.errorMessage.classList.add('hidden');
  }, 6000);
}

// Geocoding Search Suggestions
async function fetchGeocodingSuggestions(query) {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    if (!response.ok) throw new Error('Geocoding query failed');
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      renderSuggestions(data.results);
    } else {
      elements.suggestionsList.innerHTML = '<li style="color: var(--text-muted); cursor: default;">No cities found</li>';
      elements.suggestionsList.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error);
  }
}

function renderSuggestions(cities) {
  elements.suggestionsList.innerHTML = '';
  
  cities.forEach(city => {
    const li = document.createElement('li');
    const cityName = city.name;
    const country = city.country || '';
    const admin = city.admin1 ? `, ${city.admin1}` : '';
    
    li.innerHTML = `
      <span class="city-name">${cityName}</span>
      <span class="country-name">${country}${admin}</span>
    `;
    
    li.addEventListener('click', async () => {
      elements.suggestionsList.classList.add('hidden');
      elements.searchInput.value = '';
      elements.clearSearch.classList.add('hidden');
      
      const selectedCity = {
        name: city.name,
        country: city.country || '',
        lat: city.latitude,
        lon: city.longitude
      };
      
      await handleCitySelection(selectedCity);
    });
    
    elements.suggestionsList.appendChild(li);
  });
  
  elements.suggestionsList.classList.remove('hidden');
}

// Select a city to load weather
async function handleCitySelection(city) {
  showLoading(true);
  try {
    await fetchWeatherData(city);
    state.currentCity = city;
    localStorage.setItem(STORAGE_KEYS.LAST_CITY, JSON.stringify(city));
    
    // Add to recent searches
    addToRecents(city);
    
    // Update visuals
    renderWeatherDetails();
    updateMapPosition(city.lat, city.lon);
    updateChart();
    
    elements.errorMessage.classList.add('hidden');
  } catch (error) {
    showError('Fetch Error', 'Failed to retrieve weather records for the selected location.');
    console.error('Error handling city selection:', error);
  } finally {
    showLoading(false);
  }
}

// Fetch Forecast and AQI from Open-Meteo
async function fetchWeatherData({ lat, lon }) {
  try {
    // 1. Fetch Weather Forecast Data
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,precipitation,pressure_msl&hourly=temperature_2m,relative_humidity_2m,weather_code,uv_index,visibility,precipitation_probability,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) throw new Error('Forecast API returned non-200');
    state.weatherData = await weatherResponse.json();
    
    // 2. Fetch Air Quality Index Data
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone`;
    const aqiResponse = await fetch(aqiUrl);
    if (!aqiResponse.ok) throw new Error('AQI API returned non-200');
    state.aqiData = await aqiResponse.json();
  } catch (error) {
    console.error('API Fetch failed:', error);
    throw error;
  }
}

// Helper: Convert Celsius to Fahrenheit
function convertTemp(celsius) {
  if (state.unit === 'F') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

// Helper: Format wind speed and unit
function formatWindSpeed(kmh) {
  if (state.unit === 'F') {
    // convert to mph
    const mph = Math.round(kmh * 0.621371);
    return `${mph} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

// Get Compass Direction from degree
function getCompassDirection(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 22.5) % 16;
  return directions[index];
}

// Parse ISO date string to user-friendly local format
function formatTimeISO(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Get Weather Category matching WMO codes
function getWeatherCategory(code, isDay) {
  const mapping = WEATHER_CODES[code];
  if (!mapping) return 'cloudy';
  
  if (mapping.category === 'clear') {
    return isDay === 0 ? 'clear-night' : 'clear-day';
  }
  return mapping.category;
}

// Weather descriptions mapped
function getWeatherDescription(code) {
  const mapping = WEATHER_CODES[code];
  return mapping ? mapping.desc : 'Unknown';
}

// Render dynamic weather animated SVGs
function getWeatherIconSVG(code, isDay) {
  const category = getWeatherCategory(code, isDay);
  
  // Custom Animated SVG maps
  switch(category) {
    case 'clear-day':
      return `
        <svg class="anim-sun-spin" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" fill="var(--color-sunny)" stroke="var(--color-sunny)"></circle>
          <line x1="12" y1="2" x2="12" y2="4"></line>
          <line x1="12" y1="20" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="4" y2="12"></line>
          <line x1="20" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="17.66" x2="6.34" y2="16.25"></line>
          <line x1="17.66" y1="4.93" x2="16.25" y2="6.34"></line>
        </svg>
      `;
    case 'clear-night':
      return `
        <svg class="anim-cloud-float" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="var(--color-night)" stroke="var(--color-night)"></path>
        </svg>
      `;
    case 'rainy':
      return `
        <svg class="anim-cloud-float" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.04-1.24.12A7 7 0 0 0 2 12a5 5 0 0 0 5 5h10.5Z" fill="var(--color-cloudy)" stroke="var(--color-cloudy)"></path>
          <line x1="8" y1="19" x2="6" y2="22" class="anim-rain-drop-1" stroke="var(--accent-blue)"></line>
          <line x1="12" y1="19" x2="10" y2="22" class="anim-rain-drop-2" stroke="var(--accent-blue)"></line>
          <line x1="16" y1="19" x2="14" y2="22" class="anim-rain-drop-3" stroke="var(--accent-blue)"></line>
        </svg>
      `;
    case 'snowy':
      return `
        <svg class="anim-cloud-float" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.04-1.24.12A7 7 0 0 0 2 12a5 5 0 0 0 5 5h10.5Z" fill="var(--color-cloudy)" stroke="var(--color-cloudy)"></path>
          <circle cx="8" cy="20" r="1.5" fill="var(--accent-teal)" class="anim-snow-flake-1"></circle>
          <circle cx="12" cy="21" r="1.5" fill="var(--accent-teal)" class="anim-snow-flake-2"></circle>
          <circle cx="16" cy="20" r="1.5" fill="var(--accent-teal)" class="anim-snow-flake-3"></circle>
        </svg>
      `;
    case 'stormy':
      return `
        <svg class="anim-cloud-float" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.04-1.24.12A7 7 0 0 0 2 12a5 5 0 0 0 5 5h10.5Z" fill="var(--color-cloudy)" stroke="var(--color-cloudy)"></path>
          <path d="m13 16-3 4h3l-1 3 3-5h-3l1-2Z" fill="var(--color-sunny)" stroke="var(--color-sunny)" class="anim-lightning-flash"></path>
        </svg>
      `;
    case 'cloudy':
    default:
      return `
        <svg class="anim-cloud-float" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.04-1.24.12A7 7 0 0 0 2 12a5 5 0 0 0 5 5h10.5Z" fill="var(--color-cloudy)" stroke="var(--color-cloudy)"></path>
        </svg>
      `;
  }
}

// Update DOM elements with current weather state
function renderWeatherDetails() {
  if (!state.weatherData) return;
  
  const current = state.weatherData.current;
  const daily = state.weatherData.daily;
  
  // Set Background State
  const weatherCategory = getWeatherCategory(current.weather_code, current.is_day);
  elements.appBg.className = `bg-transition weather-${weatherCategory}`;
  
  // Main Card
  elements.currentCityName.textContent = state.currentCity.name;
  elements.currentCountry.textContent = state.currentCity.country;
  
  // Parse date nicely
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  elements.currentDate.textContent = new Date().toLocaleDateString('en-US', options);
  
  // Weather SVG Icon
  elements.currentIconContainer.innerHTML = getWeatherIconSVG(current.weather_code, current.is_day);
  
  // Temperatures
  elements.currentTemp.textContent = convertTemp(current.temperature_2m);
  elements.tempUnitLabel.textContent = `°${state.unit}`;
  elements.currentCondition.textContent = getWeatherDescription(current.weather_code);
  
  elements.feelsLike.textContent = `${convertTemp(current.apparent_temperature)}°${state.unit}`;
  
  const minTemp = convertTemp(daily.temperature_2m_min[0]);
  const maxTemp = convertTemp(daily.temperature_2m_max[0]);
  elements.tempMinMax.textContent = `${minTemp}°${state.unit} / ${maxTemp}°${state.unit}`;
  
  // Favorites Star Button Activation
  const isFavorite = state.favorites.some(c => c.lat === state.currentCity.lat && c.lon === state.currentCity.lon);
  if (isFavorite) {
    elements.favoriteBtn.classList.add('active');
  } else {
    elements.favoriteBtn.classList.remove('active');
  }
  
  // Metric Details
  renderAlerts();
  renderAQI();
  renderWind();
  renderHumidity();
  renderSolarTimes();
  renderUVIndex();
  renderVisibilityAndPressure();
  renderPrecipitation();
  render5DayForecast();
}

// Air Quality Metric renderer
function renderAQI() {
  if (!state.aqiData) return;
  
  const currentAQI = state.aqiData.current;
  const aqiVal = currentAQI.us_aqi;
  
  let aqiLabel = 'Good';
  let aqiClass = 'good';
  
  if (aqiVal <= 50) {
    aqiLabel = 'Good';
    aqiClass = 'good';
  } else if (aqiVal <= 100) {
    aqiLabel = 'Moderate';
    aqiClass = 'fair';
  } else if (aqiVal <= 150) {
    aqiLabel = 'Unhealthy for Sensitive';
    aqiClass = 'moderate';
  } else if (aqiVal <= 200) {
    aqiLabel = 'Unhealthy';
    aqiClass = 'poor';
  } else {
    aqiLabel = 'Hazardous';
    aqiClass = 'very-poor';
  }
  
  elements.aqiValue.textContent = `${aqiVal} (${aqiLabel})`;
  elements.aqiBadge.className = `aqi-dot ${aqiClass}`;
  
  elements.pm25Val.textContent = `${currentAQI.pm2_5.toFixed(1)} µg/m³`;
  elements.no2Val.textContent = `${currentAQI.nitrogen_dioxide.toFixed(1)} µg/m³`;
}

// Wind Metric renderer
function renderWind() {
  const current = state.weatherData.current;
  elements.windSpeed.textContent = formatWindSpeed(current.wind_speed_10m);
  
  // Rotate compass needle arrow
  const windDir = current.wind_direction_10m;
  elements.windDirArrow.style.transform = `rotate(${windDir}deg)`;
  elements.windDirText.textContent = getCompassDirection(windDir);
}

// Humidity Metric renderer
function renderHumidity() {
  const current = state.weatherData.current;
  const humidity = current.relative_humidity_2m;
  
  elements.humidityValue.textContent = `${humidity}%`;
  elements.humidityBarFill.style.width = `${humidity}%`;
  
  let humidityText = 'Comfortable';
  if (humidity < 30) humidityText = 'Dry Air';
  else if (humidity > 70) humidityText = 'Humid Air';
  
  elements.humidityStatus.textContent = humidityText;
}

// Solar Times renderer
function renderSolarTimes() {
  const daily = state.weatherData.daily;
  elements.sunriseTime.textContent = formatTimeISO(daily.sunrise[0]);
  elements.sunsetTime.textContent = formatTimeISO(daily.sunset[0]);
}

// Helper to get index of current hour in hourly forecast
function getCurrentHourIndex() {
  if (!state.weatherData || !state.weatherData.hourly) return 0;
  const hourly = state.weatherData.hourly;
  const now = new Date();
  const currentHour = now.getHours();
  let startIndex = 0;
  const timeStrings = hourly.time;
  for (let i = 0; i < timeStrings.length; i++) {
    const itemDate = new Date(timeStrings[i]);
    if (itemDate.getDate() === now.getDate() && itemDate.getHours() === currentHour) {
      startIndex = i;
      break;
    }
  }
  return startIndex;
}

// Weather Alerts Badge renderer
function renderAlerts() {
  if (!state.weatherData) return;
  const current = state.weatherData.current;
  const hourly = state.weatherData.hourly;
  const startIndex = getCurrentHourIndex();
  
  const alerts = [];
  if (current.temperature_2m > 38) {
    alerts.push('Heatwave');
  }
  if (current.wind_speed_10m > 50) {
    alerts.push('Storm');
  }
  if (hourly.precipitation_probability && hourly.precipitation_probability[startIndex] > 70) {
    alerts.push('Heavy Rain');
  }
  
  if (alerts.length > 0) {
    elements.weatherAlertText.textContent = `${alerts.join(' & ')} Alert`;
    elements.weatherAlertBadge.classList.remove('hidden');
  } else {
    elements.weatherAlertBadge.classList.add('hidden');
  }
}

// UV Index renderer
function renderUVIndex() {
  if (!state.weatherData || !state.weatherData.hourly) return;
  const hourly = state.weatherData.hourly;
  const startIndex = getCurrentHourIndex();
  const uvVal = Math.round(hourly.uv_index[startIndex] || 0);
  
  elements.uvValue.textContent = uvVal;
  
  let category = 'Low';
  let colorClass = 'uv-low';
  
  if (uvVal <= 2) {
    category = 'Low';
    colorClass = 'uv-low';
  } else if (uvVal <= 5) {
    category = 'Moderate';
    colorClass = 'uv-moderate';
  } else if (uvVal <= 7) {
    category = 'High';
    colorClass = 'uv-high';
  } else if (uvVal <= 10) {
    category = 'Very High';
    colorClass = 'uv-very-high';
  } else {
    category = 'Extreme';
    colorClass = 'uv-extreme';
  }
  
  elements.uvCategory.textContent = category;
  
  const fillPercent = Math.min((uvVal / 12) * 100, 100);
  elements.uvBarFill.style.width = `${fillPercent}%`;
  elements.uvBarFill.className = `uv-fill ${colorClass}`;
}

// Visibility & Pressure renderer
function renderVisibilityAndPressure() {
  if (!state.weatherData) return;
  const current = state.weatherData.current;
  const hourly = state.weatherData.hourly;
  const startIndex = getCurrentHourIndex();
  
  // Visibility (meters to km)
  const visMeters = hourly.visibility ? hourly.visibility[startIndex] : 10000;
  const visKm = visMeters / 1000;
  elements.visibilityValue.textContent = `${visKm.toFixed(1)} km`;
  
  let visStatus = 'Clear view';
  if (visKm >= 10) visStatus = 'Clear view';
  else if (visKm >= 5) visStatus = 'Moderate haze';
  else visStatus = 'Poor visibility';
  elements.visibilityStatus.textContent = visStatus;
  
  // Pressure
  const pressure = current.pressure_msl || 1013;
  elements.pressureValue.textContent = `${Math.round(pressure)} hPa`;
  
  let pressStatus = 'Normal';
  if (pressure > 1015) pressStatus = 'High Pressure';
  else if (pressure < 1008) pressStatus = 'Low Pressure';
  else pressStatus = 'Normal';
  elements.pressureStatus.textContent = pressStatus;
}

// Precipitation renderer
function renderPrecipitation() {
  if (!state.weatherData) return;
  const current = state.weatherData.current;
  const hourly = state.weatherData.hourly;
  const startIndex = getCurrentHourIndex();
  
  const prob = hourly.precipitation_probability ? hourly.precipitation_probability[startIndex] : 0;
  const volume = current.precipitation !== undefined ? current.precipitation : (hourly.precipitation ? hourly.precipitation[startIndex] : 0);
  
  elements.precipProb.textContent = `${prob}%`;
  elements.precipVolume.textContent = `${volume.toFixed(1)} mm`;
}

// 5-Day Forecast renderer
function render5DayForecast() {
  const daily = state.weatherData.daily;
  elements.forecastContainer.innerHTML = '';
  
  // Loop starts at index 0 (today) to index 4 (5 days including today), or 1 to 5 to show upcoming 5 days.
  // Showing tomorrow to +5 days looks better. Let's do index 1 to 5:
  for (let i = 1; i <= 5; i++) {
    if (!daily.time[i]) break;
    
    const dateStr = daily.time[i];
    const dateObj = new Date(dateStr);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    
    const wmoCode = daily.weather_code[i];
    const maxTemp = convertTemp(daily.temperature_2m_max[i]);
    const minTemp = convertTemp(daily.temperature_2m_min[i]);
    
    // Day card wrapper
    const dayCard = document.createElement('div');
    dayCard.className = 'forecast-day-card';
    
    dayCard.innerHTML = `
      <span class="day-name">${dayName}</span>
      <div class="day-icon">${getWeatherIconSVG(wmoCode, 1)}</div>
      <span class="day-cond">${getWeatherDescription(wmoCode)}</span>
      <div class="day-temps">
        <span class="day-max">${maxTemp}°</span>
        <span class="day-min">${minTemp}°</span>
      </div>
    `;
    
    elements.forecastContainer.appendChild(dayCard);
  }
}

// Interactive Temperature Chart using Chart.js
function updateChart() {
  if (!state.weatherData) return;
  
  const ctx = document.getElementById('temp-chart').getContext('2d');
  const hourly = state.weatherData.hourly;
  
  const startIndex = getCurrentHourIndex();
  
  const slicedTimes = hourly.time.slice(startIndex, startIndex + 24).map(t => {
    return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  
  const slicedTemps = hourly.temperature_2m.slice(startIndex, startIndex + 24).map(temp => {
    return convertTemp(temp);
  });
  
  // Colors depending on theme
  const gridColor = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = state.theme === 'dark' ? '#9ca3af' : '#475569';
  const labelColor = state.theme === 'dark' ? '#f3f4f6' : '#1e293b';
  
  if (tempChartInstance) {
    tempChartInstance.destroy();
  }
  
  // Create beautiful gradient background under curve
  const fillGradient = ctx.createLinearGradient(0, 0, 0, 200);
  if (state.theme === 'dark') {
    fillGradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
    fillGradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
  } else {
    fillGradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    fillGradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
  }
  
  tempChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: slicedTimes,
      datasets: [{
        label: `Temperature Trend (°${state.unit})`,
        data: slicedTemps,
        borderColor: '#3b82f6',
        borderWidth: 2.5,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: state.theme === 'dark' ? '#171b26' : '#ffffff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 6,
        tension: 0.45,
        fill: true,
        backgroundColor: fillGradient
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // We already have a header title
        },
        tooltip: {
          backgroundColor: state.theme === 'dark' ? 'rgba(15, 18, 28, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          titleColor: labelColor,
          bodyColor: labelColor,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return ` ${context.parsed.y}°${state.unit}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: textColor,
            font: {
              family: 'Outfit',
              size: 10
            },
            maxTicksLimit: 8
          }
        },
        y: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            font: {
              family: 'Outfit',
              size: 10
            },
            callback: function(value) {
              return `${value}°`;
            }
          }
        }
      }
    }
  });
}

// Leaflet Map Initialization & Controls
function initMap(lat, lon) {
  if (leafletMapInstance) return;
  
  leafletMapInstance = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([lat, lon], 12);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMapInstance);
  
  // Custom marker icon using beautiful color-coded pinpoint
  const customIcon = L.divIcon({
    className: 'custom-map-pin',
    html: '<div style="width: 14px; height: 14px; border-radius:50%; background-color:#3b82f6; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
  
  mapMarkerInstance = L.marker([lat, lon], { icon: customIcon }).addTo(leafletMapInstance);
  elements.mapCoords.textContent = `Lat: ${lat.toFixed(2)} | Lon: ${lon.toFixed(2)}`;
}

function updateMapPosition(lat, lon) {
  if (!leafletMapInstance) return;
  
  leafletMapInstance.setView([lat, lon], 12);
  
  if (mapMarkerInstance) {
    mapMarkerInstance.setLatLng([lat, lon]);
  }
  
  elements.mapCoords.textContent = `Lat: ${lat.toFixed(2)} | Lon: ${lon.toFixed(2)}`;
}

// Favorites Logic
function toggleFavoriteCity(city) {
  const index = state.favorites.findIndex(c => c.lat === city.lat && c.lon === city.lon);
  
  if (index !== -1) {
    // Remove from favorites
    state.favorites.splice(index, 1);
    elements.favoriteBtn.classList.remove('active');
  } else {
    // Add to favorites
    state.favorites.push({
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon
    });
    elements.favoriteBtn.classList.add('active');
  }
  
  saveFavorites();
  
  // Update star icon in favorites list or layout if active
  lucide.createIcons();
}

function updateFavoritesUI() {
  elements.favoritesList.innerHTML = '';
  
  if (state.favorites.length === 0) {
    elements.favoritesList.innerHTML = '<li class="empty-state">No favorite cities saved. Click the star icon next to a city to save.</li>';
    return;
  }
  
  state.favorites.forEach(city => {
    const li = document.createElement('li');
    li.className = 'panel-list-item';
    
    li.innerHTML = `
      <div class="panel-item-left">
        <span class="panel-item-name">${city.name}</span>
        <span class="panel-item-desc">${city.country}</span>
      </div>
      <div class="panel-item-right">
        <button class="delete-panel-item" title="Remove Favorite"><i data-lucide="trash-2"></i></button>
      </div>
    `;
    
    // Event: Click to load weather
    li.addEventListener('click', (e) => {
      // Check if delete button was clicked
      if (e.target.closest('.delete-panel-item')) {
        e.stopPropagation();
        toggleFavoriteCity(city);
        return;
      }
      
      elements.favoritesPanel.classList.add('hidden');
      handleCitySelection(city);
    });
    
    elements.favoritesList.appendChild(li);
  });
  
  lucide.createIcons();
}

// Recent Searches Logic (last 5 unique)
function addToRecents(city) {
  // Remove existing instance if matches
  state.recents = state.recents.filter(c => !(c.lat === city.lat && c.lon === city.lon));
  
  // Insert at front
  state.recents.unshift(city);
  
  // Cap at 5
  if (state.recents.length > 5) {
    state.recents.pop();
  }
  
  saveRecents();
}

function updateRecentUI() {
  elements.recentList.innerHTML = '';
  
  if (state.recents.length === 0) {
    elements.recentList.innerHTML = '<li class="empty-state">No recent searches.</li>';
    return;
  }
  
  state.recents.forEach(city => {
    const li = document.createElement('li');
    li.className = 'panel-list-item';
    
    li.innerHTML = `
      <div class="panel-item-left">
        <span class="panel-item-name">${city.name}</span>
        <span class="panel-item-desc">${city.country}</span>
      </div>
      <div class="panel-item-right">
        <button class="delete-panel-item" title="Remove Recent"><i data-lucide="trash-2"></i></button>
      </div>
    `;
    
    li.addEventListener('click', (e) => {
      if (e.target.closest('.delete-panel-item')) {
        e.stopPropagation();
        removeRecent(city);
        return;
      }
      
      elements.recentPanel.classList.add('hidden');
      handleCitySelection(city);
    });
    
    elements.recentList.appendChild(li);
  });
  
  lucide.createIcons();
}

function removeRecent(city) {
  state.recents = state.recents.filter(c => !(c.lat === city.lat && c.lon === city.lon));
  saveRecents();
}

// Run setup on document loaded
window.addEventListener('DOMContentLoaded', init);
