/**
 * Selects a random playlist from the data array
 * @param {Array} playlists - Array of all available playlist objects
 * @returns {Object} - A randomly selected playlist object
 */
function selectRandomPlaylist(playlists) {
  const randomIndex = Math.floor(Math.random() * playlists.length);
  return playlists[randomIndex];
}

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
 * Toggles the like state for a song on featured page
 * @param {number} songId - ID of the song to toggle
 * @param {HTMLElement} likeButton - The like button element
 */
function toggleFeaturedSongLike(songId, likeButton) {
  // Find the song across all playlists
  let foundSong = null;
  for (const playlist of data) {
    const song = playlist.songs.find(s => s.id === songId);
    if (song) {
      foundSong = song;
      break;
    }
  }

  if (!foundSong) return;

  // Toggle like state
  foundSong.liked = !foundSong.liked;

  // Update button visual
  if (foundSong.liked) {
    likeButton.classList.add('liked');
  } else {
    likeButton.classList.remove('liked');
  }

  // Save to localStorage
  saveLikedSongs();
}

/**
 * Renders the song list for the featured playlist
 * @param {Array} songs - Array of song objects to display
 */
function renderFeaturedSongList(songs) {
  const songList = document.getElementById('featuredSongList');
  songList.innerHTML = ''; // Clear existing songs

  songs.forEach((song, index) => {
    const songItem = document.createElement('li');
    songItem.className = 'song-item';

    songItem.innerHTML = `
      <div class="song-number">${index + 1}</div>
      <div class="song-details">
        <div class="song-title">${song.songTitle}</div>
        <div class="song-artist">${song.artist}</div>
      </div>
      <div class="song-album">${song.album}</div>
      <div class="song-duration">${song.duration}</div>
      <button class="song-like-button ${song.liked ? 'liked' : ''}" data-song-id="${song.id}" aria-label="Like song">
        <svg class="like-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
    `;

    songList.appendChild(songItem);

    // Add like button event listener
    const likeButton = songItem.querySelector('.song-like-button');
    likeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFeaturedSongLike(song.id, likeButton);
    });
  });
}

/**
 * Populates the featured page with a playlist's details
 * @param {Object} playlist - Playlist object to display
 */
function displayFeaturedPlaylist(playlist) {
  // Update cover image
  const featuredCover = document.getElementById('featuredCover');
  featuredCover.src = playlist.playlistCoverUrl;
  featuredCover.alt = `${playlist.playlistTitle} cover`;
  featuredCover.onerror = function() {
    this.src = 'assets/img/playlist.png'; // Fallback to default image
  };

  // Update title
  const featuredTitle = document.getElementById('featuredTitle');
  featuredTitle.textContent = playlist.playlistTitle;

  // Update creator
  const featuredCreator = document.getElementById('featuredCreator');
  featuredCreator.textContent = `by ${playlist.playlistCreator}`;

  // Update description
  const featuredDescription = document.getElementById('featuredDescription');
  featuredDescription.textContent = playlist.description;

  // Update like button state
  const featuredLike = document.getElementById('featuredLike');
  if (playlist.liked) {
    featuredLike.classList.add('liked');
  } else {
    featuredLike.classList.remove('liked');
  }

  // Update like count
  const featuredLikeCount = document.getElementById('featuredLikeCount');
  featuredLikeCount.textContent = `${playlist.likeCount} likes`;

  // Render song list
  renderFeaturedSongList(playlist.songs);

  // Store current playlist for like and shuffle functionality
  window.currentFeaturedPlaylist = playlist;
}

/**
 * Gets an AI-generated description for a playlist with fallback APIs
 * @param {Object} playlist - Playlist object with title, creator, and songs
 * @returns {Promise<string>} - AI-generated description or fallback error message
 */
async function getPlaylistDescription(playlist) {
  // Format song list for the prompt
  const songList = playlist.songs
    .map(song => `${song.songTitle} - ${song.artist}`)
    .join('\n');

  const systemPrompt = 'You are a music curator and playlist expert who writes engaging, vivid descriptions that capture the mood and theme of playlists.';

  const userPrompt = `Generate a description for this playlist:

Title: ${playlist.playlistTitle}
Creator: ${playlist.playlistCreator}
Songs:
${songList}

Write a compelling 2-3 sentence description that captures the vibe, emotional tone, and ideal use case for this playlist. Do NOT list individual songs by name. Do NOT use generic marketing phrases. Keep it under 100 words.`;

  // Define free API configurations (tried in order)
  const apiProviders = [
    {
      name: 'OpenRouter',
      call: () => callOpenRouter(systemPrompt, userPrompt)
    },
    {
      name: 'Hugging Face',
      call: () => callHuggingFace(userPrompt)
    }
  ];

  // Try each API in order
  for (const provider of apiProviders) {
    console.log(`Trying ${provider.name}...`);
    const result = await provider.call();

    if (result.success) {
      console.log(`✓ Success with ${provider.name}`);
      return result.description;
    }

    console.log(`✗ ${provider.name} failed:`, result.error);
  }

  // All APIs failed
  return 'Unable to generate description. All free APIs are currently unavailable. Try again later.';
}

/**
 * Calls OpenRouter API with retry logic
 */
async function callOpenRouter(systemPrompt, userPrompt, retryCount = 0) {
  const OPENROUTER_API_KEY = 'YOUR_OPENROUTER_API_KEY_HERE'; // Replace with your OpenRouter API key
  const maxRetries = 5;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Music Playlist Explorer'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      // Handle rate limit with retry
      if (response.status === 429 && retryCount < maxRetries) {
        console.log(`Rate limited. Retrying in 1 second... (Attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return callOpenRouter(systemPrompt, userPrompt, retryCount + 1);
      }

      return { success: false, error: `Status ${response.status}` };
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (!description) {
      return { success: false, error: 'Empty response' };
    }

    return { success: true, description };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calls Hugging Face Inference API (free)
 */
async function callHuggingFace(prompt, retryCount = 0) {
  const maxRetries = 3;

  try {
    // Using free inference API (no key required for public models)
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      // Model might be loading, retry
      if (response.status === 503 && retryCount < maxRetries) {
        console.log(`Model loading. Retrying in 2 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return callHuggingFace(prompt, retryCount + 1);
      }

      return { success: false, error: `Status ${response.status}` };
    }

    const data = await response.json();
    const description = data[0]?.generated_text?.trim();

    if (!description) {
      return { success: false, error: 'Empty response' };
    }

    return { success: true, description };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Toggles the like state for the featured playlist
 */
function toggleFeaturedLike() {
  const playlist = window.currentFeaturedPlaylist;
  if (!playlist) return;

  // Toggle like state
  if (playlist.liked) {
    playlist.liked = false;
    playlist.likeCount--;
  } else {
    playlist.liked = true;
    playlist.likeCount++;
  }

  // Update like button
  const featuredLike = document.getElementById('featuredLike');
  if (playlist.liked) {
    featuredLike.classList.add('liked');
  } else {
    featuredLike.classList.remove('liked');
  }

  // Update like count
  const featuredLikeCount = document.getElementById('featuredLikeCount');
  featuredLikeCount.textContent = `${playlist.likeCount} likes`;
}

/**
 * Shuffles the songs in the featured playlist
 */
function shuffleFeaturedPlaylist() {
  const playlist = window.currentFeaturedPlaylist;
  if (!playlist) return;

  // Shuffle songs using Fisher-Yates algorithm
  const shuffled = [...playlist.songs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Render shuffled list
  renderFeaturedSongList(shuffled);
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

// Initialize the featured page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Load liked songs from localStorage
  loadLikedSongs();

  // Select and display a random playlist
  const randomPlaylist = selectRandomPlaylist(data);
  displayFeaturedPlaylist(randomPlaylist);

  // Setup like button
  const featuredLike = document.getElementById('featuredLike');
  featuredLike.addEventListener('click', toggleFeaturedLike);

  // Setup shuffle button
  const featuredShuffle = document.getElementById('featuredShuffle');
  featuredShuffle.addEventListener('click', shuffleFeaturedPlaylist);

  // Setup search functionality
  setupSearch();

  // Setup AI description button
  const featuredAiButton = document.getElementById('featuredAiButton');
  const featuredAiResult = document.getElementById('featuredAiResult');

  featuredAiButton.addEventListener('click', async () => {
    const playlist = window.currentFeaturedPlaylist;
    if (!playlist) return;

    // Show loading state
    featuredAiResult.style.display = 'block';
    featuredAiResult.className = 'ai-description-result loading';
    featuredAiResult.textContent = 'Generating description...';
    featuredAiButton.disabled = true;

    // Get AI description
    const description = await getPlaylistDescription(playlist);

    // Show result
    if (description.startsWith('Unable to generate')) {
      featuredAiResult.className = 'ai-description-result error';
    } else {
      featuredAiResult.className = 'ai-description-result';
    }
    featuredAiResult.textContent = description;
    featuredAiButton.disabled = false;
  });
});
