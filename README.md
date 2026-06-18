# 🌤️ AeroWeather Dashboard

AeroWeather is a modern, responsive, frontend-only weather dashboard designed with a premium glassmorphic UI. It delivers real-time weather analytics, AQI details, and 24-hour temperature trends alongside an interactive map, all without requiring any API keys.

---

## 🚀 Key Features

- **Glassmorphism UI**: High-end styling using CSS variables, backdrop-filter blurs, micro-interactions, and harmonic HSL colors.
- **Dynamic Backgrounds**: Responsive, smooth linear-gradient transitions that dynamically update the app's visual atmosphere depending on the weather conditions (sunny, rainy, cloudy, snowy, stormy, clear night).
- **Interactive Weather Chart**: Custom-styled [Chart.js](https://www.chartjs.org/) temperature trend line chart mapping the next 24 hours with gradient overlays under the curve.
- **Thematic Location Map**: [Leaflet.js](https://leafletjs.com/) map centered on the selected city with a custom map marker. Employs a custom CSS layer filter trick to adapt standard map tiles into high-tech dark mode maps.
- **Dynamic Unit Toggles**: Switch between Celsius (°C / km/h) and Fahrenheit (°F / mph) with instant, client-side recalculations. No additional API requests needed.
- **Custom Animated SVG Icons**: Built-in, vector-based weather icons that animate dynamically via CSS `@keyframes` (spinning sun, floating clouds, falling rain/snow, flashing lightning, blowing wind).
- **Air Quality Index (AQI)**: Captures USA AQI indices with color-coded severity indicator dots and key pollutant readouts (PM2.5, NO₂).
- **Sunrise & Sunset Times**: Properly formatted 12-hour AM/PM solar events calculated using the city's local timezone settings.
- **Favorite Cities & History**: 
  - Save favorite cities to a persistent side panel (saved to `localStorage`).
  - Stores the last 5 searched cities as recent searches (saved to `localStorage`).
- **Loading & Error States**: Seamless spinner overlay during API fetches and clean alert card notifications for search mismatches.

---

## 🛠️ Technology Stack

- **Core Structure**: HTML5 (Semantic elements, responsive layout)
- **Styling**: CSS3 (Vanilla design, custom layout grids, variables, media queries)
- **Logic**: Vanilla ES6+ JavaScript (Async/Await fetch patterns, LocalStorage, Web APIs)
- **Libraries (via CDN)**:
  - **Leaflet.js** for mapping
  - **Chart.js** for graphs
  - **Lucide Icons** for icons

---

## 📂 Project Structure

```bash
Weather App/
├── index.html       # Application layout & CDN integrations
├── style.css        # Responsive layouts, glassmorphic styling & keyframe animations
├── script.js        # Geocoding, API callers, unit converters & chart-map controllers
└── .gitignore       # Git exclusion rules
```

---

## ⚙️ How to Run Locally

Since this dashboard is completely client-side, it runs in any modern browser. To ensure cross-origin request policies (CORS) behave correctly when fetching external scripts and maps, run the app through a local web server:

### Option 1: Python (Recommended)
Open your terminal in the project directory and run:
```bash
python -m http.server 8080
```
Then visit **`http://localhost:8080`** in your browser.

### Option 2: Node.js (npx)
If you have Node.js installed, execute:
```bash
npx serve -l 8080 .
```
Then visit **`http://localhost:8080`** in your browser.

---

## 📊 Weather Data Source
AeroWeather queries the free, open-source **[Open-Meteo Weather APIs](https://open-meteo.com)**. No API keys are required, offering unlimited high-resolution weather forecasts and real-time geocoding.

---

## 📝 License
This project is open-source and free to use for educational and portfolio purposes.
