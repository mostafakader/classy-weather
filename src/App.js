import React, { useState, useEffect, useCallback } from "react";
import "./index.css";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return "🏳"; // علم افتراضي في حالة فشل التحويل
  }
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

const App = () => {
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState('');
  const [weather, setWeather] = useState({});

  const fetchWeather = useCallback(async () => {
    if (location.length < 2) return setWeather({});
    try {
      setIsLoading(true);
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${location}`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } = geoData.results[0];
      setDisplayLocation(`${name} ${convertToFlag(country_code)}`);
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData.daily);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchWeather();
  }, [location, fetchWeather]);

  return (
    <div className="app">
      <h1>Claasy Weather</h1>
      <input
        type="text"
        placeholder="Search for location...."
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      {isLoading && <p className="loader">Loading...</p>}
      {weather.weathercode && <Weather weather={weather} location={displayLocation} />}
    </div>
  );
};

const Weather = ({ weather, location }) => {
  const { temperature_2m_max: max, temperature_2m_min: min, time: dates, weathercode: code } = weather;
  return (
    <div>
      <h2>Weather in {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max[i]}
            min={min[i]}
            code={code[i]}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
};

const Day = ({ date, max, min, code, isToday }) => (
  <li className="day">
    <span>{getWeatherIcon(code)}</span>
    <p>{isToday ? "Today" : formatDay(date)}</p>
    <p>{Math.floor(min)}&deg; &mdash; {Math.ceil(max)}&deg;</p>
  </li>
);

export default App;
