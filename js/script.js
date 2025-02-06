document.addEventListener("DOMContentLoaded", function () {
  const searchForm = document.querySelector("form");
  const searchInput = document.querySelector("input");
  const resultsBlock = document.getElementById("results");
  const historyBlock = document.getElementById("search-history");
  const themeToggle = document.getElementById("theme-toggle");
  const languageToggle = document.getElementById("language-toggle");

  let currentLanguage = localStorage.getItem("language") || "en";
  const currentTheme = localStorage.getItem("theme");

  const clearHistoryBtn = document.createElement("button");
  clearHistoryBtn.classList.add("clear-history-btn");
  clearHistoryBtn.onclick = function () {
    localStorage.removeItem("searchHistory");
    historyBlock.innerHTML = `<h3>${translations[currentLanguage].searchHistory}</h3>`;
  };

  if (currentTheme === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀";
  } else {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "🌙";
  }

  const translations = {
    en: {
      title: "The tracks you're looking for",
      description: "Enter the name of the song, artist, or keywords.",
      search_placeholder: "For example: O Green World - Gorillaz",
      search_button: "Search",
      results_title: "Search Results:",
      error_message: "Unfortunately, nothing was found. Try another query.",
      history: "Search History:",
      clear_history: "Clear the history",
      searchHistory: "Search History:",
      clearHistory: "Clear History",
      searchResults: "Search results for",
      nothingFound: "Nothing was found for",
      tryAnother: "Try another query.",
      errorOccurred: "An error occurred when searching for tracks.",
      lookingFor: "Looking for tracks on request:",
    },
    ru: {
      title: "Треки, которые ты ищешь",
      description: "Введите название песни, исполнителя или ключевые слова.",
      search_placeholder: "Например: O Green World - Gorillaz",
      search_button: "Поиск",
      results_title: "Результаты поиска:",
      error_message:
        "К сожалению, ничего не найдено. Попробуйте другой запрос.",
      history: "История поиска:",
      clear_history: "Очистить историю",
      searchHistory: "История поиска:",
      clearHistory: "Очистить историю",
      searchResults: "Результаты поиска для",
      nothingFound: "Ничего не найдено по запросу",
      tryAnother: "Попробуйте другой запрос.",
      errorOccurred: "Произошла ошибка при поиске треков.",
      lookingFor: "Ищем треки по запросу:",
    },
  };

  async function getSpotifyToken() {
    const clientId = "8e7d04a0f9004fefae9d8400f65593c5";
    const clientSecret = "8c394a951c3c4491945641baa3902b63";

    console.log("Получаем токен доступа...");

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        throw new Error(`Ошибка при получении токена: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Токен успешно получен:", data.access_token);
      return data.access_token;
    } catch (error) {
      console.error("Ошибка при получении токена:", error);
      throw error;
    }
  }

  async function searchTracks(query) {
    console.log("Начинаем поиск треков...");

    try {
      const token = await getSpotifyToken();
      resultsBlock.innerHTML = `<p>${translations[currentLanguage].lookingFor} <strong>${query}</strong>...</p>`;

      console.log("Отправляем запрос к Spotify API...");
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Ошибка при запросе к Spotify API: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Ответ от Spotify API:", data);

      if (!data.tracks || data.tracks.items.length === 0) {
        console.log("Треки не найдены.");
        resultsBlock.innerHTML = `<p>${translations[currentLanguage].nothingFound} "<strong>${query}</strong>". ${translations[currentLanguage].tryAnother}</p>`;
        return;
      }

      const tracks = data.tracks.items;
      let html = `<p>${translations[currentLanguage].searchResults} "<strong>${query}</strong>":</p><ul>`;

      tracks.forEach((track) => {
        const albumImage =
          track.album.images[0]?.url || "image/default-cover.png"; // Обложка альбома
        const trackUrl = track.external_urls.spotify; // Ссылка на трек в Spotify

        html += `
          <li>
            <a href="${trackUrl}" target="_blank">
              <div class="track-item">
                <div class="track-info">
                  ${track.name} - ${track.artists
          .map((artist) => artist.name)
          .join(", ")}
                </div>
                <img src="${albumImage}" alt="${
          track.name
        }" class="track-image"/>
              </div>
            </a>
          </li>`;
      });

      html += `</ul>`;
      resultsBlock.innerHTML = html;
      console.log("Треки успешно отображены.");
    } catch (error) {
      console.error("Ошибка при поиске треков:", error);
      resultsBlock.innerHTML = `<p>${translations[currentLanguage].errorOccurred}</p>`;
    }
  }

  function translatePage() {
    const elements = document.querySelectorAll("[data-lang]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-lang");
      if (translations[currentLanguage][key]) {
        element.textContent = translations[currentLanguage][key];
      }
    });

    const input = document.getElementById("searchInput");
    if (input && translations[currentLanguage].search_placeholder) {
      input.placeholder = translations[currentLanguage].search_placeholder;
    }
  }

  function updateLanguage() {
    const lang = translations[currentLanguage];
    historyBlock.innerHTML = `<h3>${lang.searchHistory}</h3>`;

    loadHistory();

    if (!document.querySelector(".clear-history-btn")) {
      clearHistoryBtn.textContent = lang.clearHistory;
      historyBlock.appendChild(clearHistoryBtn);
    }

    languageToggle.textContent =
      currentLanguage === "en" ? "RU | EN" : "EN | RU";
  }

  function loadHistory() {
    const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    history.forEach((query) => {
      const btn = document.createElement("button");
      btn.textContent = query;
      btn.onclick = () => {
        searchInput.value = query;
        searchTracks(query);
      };
      historyBlock.appendChild(btn);
    });
  }

  function saveToHistory(query) {
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    if (!history.includes(query)) {
      history.unshift(query);
      if (history.length > 5) history.pop();
      localStorage.setItem("searchHistory", JSON.stringify(history));
    }
    updateLanguage();
  }

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query === "") return;
    searchTracks(query);
    saveToHistory(query);
  });

  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("light-mode");
    document.body.classList.toggle("dark-mode");
    const newTheme = document.body.classList.contains("light-mode")
      ? "light"
      : "dark";
    localStorage.setItem("theme", newTheme);
    themeToggle.textContent = newTheme === "light" ? "☀" : "🌙";
  });

  languageToggle.addEventListener("click", function () {
    currentLanguage = currentLanguage === "en" ? "ru" : "en";
    localStorage.setItem("language", currentLanguage);
    updateLanguage();
    translatePage();
  });

  translatePage();
  updateLanguage();
});
