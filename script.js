
let searchHistory = [];
const weatherApiRootUrl = 'https://api.openweathermap.org';
const weatherApiKey = '412660a4fc60e98b070e5ec4c2dbd193';


const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const todayContainer = document.querySelector('#today');
const forecastContainer = document.querySelector('#forecast');
const searchHistoryContainer = document.querySelector('#history');

dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

function renderSearchHistory() {
  searchHistoryContainer.innerHTML = '';
  for (let i = searchHistory.length - 1; i >= 0; i--) {
    const btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.classList.add('history-btn', 'btn-history');
    btn.setAttribute('data-search', searchHistory[i]);
    btn.textContent = searchHistory[i];
    searchHistoryContainer.append(btn);
  }
}

function appendToHistory(search) {
  if (searchHistory.includes(search)) return;
  searchHistory.push(search);
  localStorage.setItem('search-history', JSON.stringify(searchHistory));
  renderSearchHistory();
}


function initSearchHistory() {
  const storedHistory = localStorage.getItem('search-history');
  if (storedHistory) {
    searchHistory = JSON.parse(storedHistory);
  }
  renderSearchHistory();
}


function renderCurrentWeather(city, weather) {
  const date = dayjs().format('M/D/YYYY');
  const { temp } = weather.main;
  const { speed: windSpeed } = weather.wind;
  const { humidity } = weather.main;
  const iconUrl = `https://openweathermap.org/img/w/${weather.weather[0].icon}.png`;

  todayContainer.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h2 class="h3 card-title">${city} (${date})</h2>
        <img src="${iconUrl}" alt="${weather.weather[0].description}" class="weather-img">
        <p class="card-text">Temp: ${temp}°F</p>
        <p class="card-text">Wind: ${windSpeed} MPH</p>
        <p class="card-text">Humidity: ${humidity} %</p>
      </div>
    </div>
  `;
}

function renderForecastCard(forecast) {
  const iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  const date = dayjs(forecast.dt_txt).format('M/D/YYYY');
  const { temp } = forecast.main;
  const { humidity } = forecast.main;
  const { speed: windSpeed } = forecast.wind;

  const forecastHTML = `
    <div class="col-md five-day-card">
      <div class="card bg-primary h-100 text-white">
        <div class="card-body p-2">
          <h5 class="card-title">${date}</h5>
          <img src="${iconUrl}" alt="${forecast.weather[0].description}">
          <p class="card-text">Temp: ${temp} °F</p>
          <p class="card-text">Wind: ${windSpeed} MPH</p>
          <p class="card-text">Humidity: ${humidity} %</p>
        </div>
      </div>
    </div>
  `;
  forecastContainer.insertAdjacentHTML('beforeend', forecastHTML);
}


function renderForecast(dailyForecast) {
  const startDt = dayjs().add(1, 'day').startOf('day').unix();
  const endDt = dayjs().add(6, 'day').startOf('day').unix();

  forecastContainer.innerHTML = `<div class="col-12"><h4>5-Day Forecast:</h4></div>`;
  dailyForecast.forEach((forecast) => {
    if (forecast.dt >= startDt && forecast.dt < endDt && forecast.dt_txt.includes('12:00:00')) {
      renderForecastCard(forecast);
    }
  });
}


async function fetchWeather({ lat, lon, name }) {
  const apiUrl = `${weatherApiRootUrl}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    renderCurrentWeather(name, data.list[0]);
    renderForecast(data.list);
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}


async function fetchCoords(search) {
  const apiUrl = `${weatherApiRootUrl}/geo/1.0/direct?q=${search}&limit=5&appid=${weatherApiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (!data[0]) {
      alert('Location not found');
      return;
    }
    appendToHistory(search);
    fetchWeather(data[0]);
  } catch (error) {
    console.error('Error fetching coordinates:', error);
  }
}


function handleSearchFormSubmit(e) {
  e.preventDefault();
  const search = searchInput.value.trim();
  if (search) {
    fetchCoords(search);
    searchInput.value = '';
  }
}


function handleSearchHistoryClick(e) {
  if (!e.target.matches('.btn-history')) return;
  const search = e.target.getAttribute('data-search');
  fetchCoords(search);
}


initSearchHistory();
searchForm.addEventListener('submit', handleSearchFormSubmit);
searchHistoryContainer.addEventListener('click', handleSearchHistoryClick);
