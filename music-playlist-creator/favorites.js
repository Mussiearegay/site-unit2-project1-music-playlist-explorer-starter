/**
 * Loads liked songs from localStorage
 */
function loadLikedSongs() {
  const likedSongs = localStorage.getItem('likedSongs');
  if (likedSongs) {
    const likedSongIds = JSON.parse(likedSongs);

    // Mark songs as liked in the data
    data.forEach(playlist => {
      playlist.songs.forEach(song => {
        if (likedSongIds.includes(song.id)) {
          song.liked = true;
        }
      });
    });
  }
}

/**
 * Saves liked songs to localStorage
 */
function saveLikedSongs() {
  const likedSongIds = [];

  data.forEach(playlist => {
    playlist.songs.forEach(song => {
      if (song.liked) {
        likedSongIds.push(song.id);
      }
    });
  });

  localStorage.setItem('likedSongs', JSON.stringify(likedSongIds));
}

/**
 * Gets all favorite songs from all playlists
 * @returns {Array} Array of liked songs with playlist info
 */
function getFavoriteSongs() {
  const favorites = [];

  data.forEach(playlist => {
    playlist.songs.forEach(song => {
      if (song.liked) {
        favorites.push({
          ...song,
          playlistTitle: playlist.playlistTitle,
          playlistCreator: playlist.playlistCreator
        });
      }
    });
  });

  return favorites;
}

/**
 * Renders the favorites song list
 * @param {Array} songs - Array of favorite songs to display
 */
function renderFavoritesSongList(songs) {
  const songList = document.getElementById('favoritesSongList');
  const favoritesCount = document.getElementById('favoritesCount');

  // Update count
  favoritesCount.textContent = `${songs.length} favorite ${songs.length === 1 ? 'song' : 'songs'}`;

  // Clear existing
  songList.innerHTML = '';

  if (songs.length === 0) {
    songList.innerHTML = '<p style="color: #b3b3b3; padding: 24px; text-align: center;">No favorite songs yet. Heart some songs from playlists to see them here!</p>';
    return;
  }

  songs.forEach((song, index) => {
    const songItem = document.createElement('li');
    songItem.className = 'song-item';

    songItem.innerHTML = `
      <div class="song-number">${index + 1}</div>
      <div class="song-details">
        <div class="song-title">${song.songTitle}</div>
        <div class="song-artist">${song.artist} • ${song.playlistTitle}</div>
      </div>
      <div class="song-album">${song.album}</div>
      <div class="song-duration">${song.duration}</div>
      <button class="song-like-button liked" data-song-id="${song.id}" aria-label="Unlike song">
        <svg class="like-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
    `;

    songList.appendChild(songItem);

    // Add unlike button event listener
    const likeButton = songItem.querySelector('.song-like-button');
    likeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavoriteSongLike(song.id, songItem);
    });
  });
}

/**
 * Toggles like for a song on the favorites page
 * @param {number} songId - ID of the song
 * @param {HTMLElement} songItem - The song item to remove
 */
function toggleFavoriteSongLike(songId, songItem) {
  // Find and unlike the song
  let foundSong = null;
  for (const playlist of data) {
    const song = playlist.songs.find(s => s.id === songId);
    if (song) {
      foundSong = song;
      break;
    }
  }

  if (!foundSong) return;

  // Unlike the song
  foundSong.liked = false;

  // Save to localStorage
  saveLikedSongs();

  // Fade out and remove from list
  songItem.style.transition = 'opacity 0.3s ease';
  songItem.style.opacity = '0';

  setTimeout(() => {
    // Re-render the entire list
    const favorites = getFavoriteSongs();
    renderFavoritesSongList(favorites);
  }, 300);
}

/**
 * Searches for songs across all playlists
 * @param {string} query - Search query
 * @returns {Array} Array of search results with song and playlist info
 */
function searchSongs(query) {
  const results = [];
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return results;

  data.forEach(playlist => {
    playlist.songs.forEach(song => {
      const songTitle = song.songTitle.toLowerCase();
      const artist = song.artist.toLowerCase();
      const album = song.album.toLowerCase();

      if (songTitle.includes(lowerQuery) || artist.includes(lowerQuery) || album.includes(lowerQuery)) {
        results.push({
          song: song,
          playlist: playlist
        });
      }
    });
  });

  return results;
}

/**
 * Renders search results
 * @param {Array} results - Search results
 */
function renderSearchResults(results) {
  const searchResults = document.getElementById('searchResults');
  searchResults.innerHTML = '';

  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-no-results">No songs found</div>';
    searchResults.removeAttribute('hidden');
    return;
  }

  results.forEach(result => {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';

    resultItem.innerHTML = `
      <div class="search-result-song">${result.song.songTitle}</div>
      <div class="search-result-artist">${result.song.artist}</div>
      <div class="search-result-playlist">in ${result.playlist.playlistTitle}</div>
    `;

    resultItem.addEventListener('click', () => {
      // Redirect to home page with playlist
      window.location.href = `index.html?playlist=${result.playlist.id}`;
    });

    searchResults.appendChild(resultItem);
  });

  searchResults.removeAttribute('hidden');
}

/**
 * Sets up search functionality
 */
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  let searchTimeout;

  // Handle search input
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);

    const query = e.target.value;

    if (!query.trim()) {
      searchResults.setAttribute('hidden', '');
      return;
    }

    // Debounce search
    searchTimeout = setTimeout(() => {
      const results = searchSongs(query);
      renderSearchResults(results);
    }, 300);
  });

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.setAttribute('hidden', '');
    }
  });

  // Keep search open when clicking inside
  searchInput.addEventListener('click', (e) => {
    e.stopPropagation();
    if (searchInput.value.trim()) {
      const results = searchSongs(searchInput.value);
      renderSearchResults(results);
    }
  });
}

// Initialize the favorites page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Load liked songs from localStorage
  loadLikedSongs();

  const favorites = getFavoriteSongs();
  renderFavoritesSongList(favorites);

  // Setup search functionality
  setupSearch();
});
