/**
 * Renders playlist cards dynamically from the data array
 * @param {Array} playlists - Array of playlist objects matching the data schema
 */
function renderPlaylistCards(playlists) {
  const container = document.querySelector('.playlist-cards');

  // Clear any existing content (including the hard-coded sample card)
  container.innerHTML = '';

  // Handle empty playlist case
  if (!playlists || playlists.length === 0) {
    container.innerHTML = '<p class="no-playlists">No playlists found</p>';
    return;
  }

  // Create and append a card for each playlist
  playlists.forEach(playlist => {
    const card = createPlaylistCard(playlist);
    container.appendChild(card);
  });
}

/**
 * Creates a single playlist card element
 * @param {Object} playlist - Playlist object with all required fields
 * @returns {HTMLElement} - Complete playlist card element
 */
function createPlaylistCard(playlist) {
  // Create card container
  const card = document.createElement('article');
  card.className = 'playlist-card';
  card.dataset.playlistId = playlist.id;

  // Create cover section with image and play button
  const coverDiv = document.createElement('div');
  coverDiv.className = 'playlist-cover';

  const coverImg = document.createElement('img');
  coverImg.src = playlist.playlistCoverUrl;
  coverImg.alt = `${playlist.playlistTitle} cover`;
  coverImg.className = 'cover-image';
  // Add error handling for missing images
  coverImg.onerror = function() {
    this.src = 'assets/img/playlist.png'; // Fallback to default image
  };

  const playButton = document.createElement('button');
  playButton.className = 'play-button';
  playButton.setAttribute('aria-label', 'Play playlist');
  playButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M8 5v14l11-7z"/>
    </svg>
  `;

  coverDiv.appendChild(coverImg);
  coverDiv.appendChild(playButton);

  // Create info section
  const infoDiv = document.createElement('div');
  infoDiv.className = 'playlist-info';

  const title = document.createElement('h4');
  title.className = 'playlist-title';
  title.textContent = playlist.playlistTitle;

  const creator = document.createElement('p');
  creator.className = 'playlist-creator';
  creator.textContent = `by ${playlist.playlistCreator}`;

  // Create stats section with like button and count
  const statsDiv = document.createElement('div');
  statsDiv.className = 'playlist-stats';

  const likeButton = document.createElement('button');
  likeButton.className = 'like-button';
  if (playlist.liked) {
    likeButton.classList.add('liked');
  }
  likeButton.setAttribute('aria-label', 'Like playlist');
  likeButton.innerHTML = `
    <svg class="like-icon" viewBox="0 0 24 24" width="20" height="20">
      <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  `;

  const likeCount = document.createElement('span');
  likeCount.className = 'like-count';
  likeCount.textContent = `${playlist.likeCount} likes`;

  // Add like toggle event listener
  likeButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent card click from opening modal
    toggleLike(playlist.id, likeButton, likeCount);
  });

  statsDiv.appendChild(likeButton);
  statsDiv.appendChild(likeCount);

  // Assemble the info section
  infoDiv.appendChild(title);
  infoDiv.appendChild(creator);
  infoDiv.appendChild(statsDiv);

  // Create edit button
  const editButton = document.createElement('button');
  editButton.className = 'edit-playlist-button';
  editButton.setAttribute('aria-label', 'Edit playlist');
  editButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  `;

  editButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent card click from opening modal
    openEditForm(playlist);
  });

  // Create delete button
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-playlist-button';
  deleteButton.setAttribute('aria-label', 'Delete playlist');
  deleteButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  `;

  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent card click from opening modal
    deletePlaylist(playlist.id);
  });

  // Assemble the complete card
  card.appendChild(editButton);
  card.appendChild(deleteButton);
  card.appendChild(coverDiv);
  card.appendChild(infoDiv);

  // Add click event to open modal
  card.addEventListener('click', () => {
    openModal(playlist);
  });

  return card;
}

/**
 * Toggles the like state for a playlist
 * @param {number} playlistId - Unique identifier for the playlist
 * @param {HTMLElement} likeButton - The like button DOM element to update
 * @param {HTMLElement} likeCountElement - The element displaying like count
 */
function toggleLike(playlistId, likeButton, likeCountElement) {
  // Find the playlist in the data array
  const playlist = data.find(p => p.id === playlistId);

  if (!playlist) return;

  // Toggle like state
  if (playlist.liked) {
    // Branch 2: Liked → Unliked
    playlist.liked = false;
    playlist.likeCount--;
    likeButton.classList.remove('liked');
  } else {
    // Branch 1: Unliked → Liked
    playlist.liked = true;
    playlist.likeCount++;
    likeButton.classList.add('liked');
  }

  // Update like count display
  likeCountElement.textContent = `${playlist.likeCount} likes`;

  // Update modal like button if modal is open
  const modalLikeButton = document.querySelector('.modal-like-button');
  const modalOverlay = document.querySelector('.modal-overlay');
  if (!modalOverlay.hasAttribute('hidden')) {
    // Update modal like button to match state
    if (playlist.liked) {
      modalLikeButton.classList.add('liked');
    } else {
      modalLikeButton.classList.remove('liked');
    }
  }
}

/**
 * Populates the modal with playlist details
 * @param {Object} playlist - Playlist object with all required fields
 */
function populateModal(playlist) {
  // Update cover image
  const modalCover = document.querySelector('.modal-cover');
  modalCover.src = playlist.playlistCoverUrl;
  modalCover.alt = `${playlist.playlistTitle} cover`;
  modalCover.onerror = function() {
    this.src = 'assets/img/playlist.png'; // Fallback to default image
  };

  // Update title
  const modalTitle = document.querySelector('.modal-title');
  modalTitle.textContent = playlist.playlistTitle;

  // Update creator
  const modalCreator = document.querySelector('.modal-creator');
  modalCreator.textContent = `by ${playlist.playlistCreator}`;

  // Update description
  const modalDescription = document.querySelector('.modal-description');
  modalDescription.textContent = playlist.description;

  // Update modal like button state
  const modalLikeButton = document.querySelector('.modal-like-button');
  if (playlist.liked) {
    modalLikeButton.classList.add('liked');
  } else {
    modalLikeButton.classList.remove('liked');
  }

  // Add like button event listener (remove old listener by cloning)
  const newModalLikeButton = modalLikeButton.cloneNode(true);
  modalLikeButton.parentNode.replaceChild(newModalLikeButton, modalLikeButton);

  newModalLikeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    // Find the card's like button and count to update both
    const card = document.querySelector(`[data-playlist-id="${playlist.id}"]`);
    const cardLikeButton = card.querySelector('.like-button');
    const cardLikeCount = card.querySelector('.like-count');
    toggleLike(playlist.id, cardLikeButton, cardLikeCount);
  });

  // Populate song list with original order
  renderSongList(playlist.songs);

  // Setup shuffle button
  const shuffleButton = document.querySelector('.shuffle-button');
  const newShuffleButton = shuffleButton.cloneNode(true);
  shuffleButton.parentNode.replaceChild(newShuffleButton, shuffleButton);

  newShuffleButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const shuffledSongs = shuffleSongs(playlist.songs);
    renderSongList(shuffledSongs);
  });

  // Setup AI description button
  const aiButton = document.querySelector('.ai-description-button');
  const newAiButton = aiButton.cloneNode(true);
  aiButton.parentNode.replaceChild(newAiButton, aiButton);

  const aiResult = document.querySelector('.ai-description-result');
  aiResult.style.display = 'none'; // Hide result on modal open

  newAiButton.addEventListener('click', async (e) => {
    e.stopPropagation();

    // Show loading state
    aiResult.style.display = 'block';
    aiResult.className = 'ai-description-result loading';
    aiResult.textContent = 'Generating description...';
    newAiButton.disabled = true;

    // Get AI description
    const description = await getPlaylistDescription(playlist);

    // Show result
    if (description.startsWith('Unable to generate')) {
      aiResult.className = 'ai-description-result error';
    } else {
      aiResult.className = 'ai-description-result';
    }
    aiResult.textContent = description;
    newAiButton.disabled = false;
  });
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
 * Toggles the like state for a song
 * @param {number} songId - ID of the song to toggle
 * @param {HTMLElement} likeButton - The like button element
 */
function toggleSongLike(songId, likeButton) {
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
 * Renders the song list in the modal
 * @param {Array} songs - Array of song objects to display
 */
function renderSongList(songs) {
  const songList = document.querySelector('.song-list');
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
      toggleSongLike(song.id, likeButton);
    });
  });
}

/**
 * Shuffles an array of songs using Fisher-Yates algorithm
 * @param {Array} songs - Array of song objects to shuffle
 * @returns {Array} - New array with songs in randomized order
 */
function shuffleSongs(songs) {
  // Create a shallow copy to avoid modifying the original array
  const shuffled = [...songs];

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Opens the modal and populates it with playlist data
 * @param {Object} playlist - Playlist object to display
 */
function openModal(playlist) {
  const modalOverlay = document.querySelector('.modal-overlay');

  // Populate modal with playlist data
  populateModal(playlist);

  // Show modal
  modalOverlay.removeAttribute('hidden');

  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
}

/**
 * Closes the modal
 */
function closeModal() {
  const modalOverlay = document.querySelector('.modal-overlay');

  // Hide modal
  modalOverlay.setAttribute('hidden', '');

  // Restore body scroll
  document.body.style.overflow = '';
}

/**
 * Sets up modal event listeners
 */
function setupModalListeners() {
  const modalOverlay = document.querySelector('.modal-overlay');
  const modalContent = document.querySelector('.modal-content');
  const modalClose = document.querySelector('.detail-modal-close');

  // Close modal when clicking the X button
  modalClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  // Close modal when clicking the overlay (outside modal content)
  modalOverlay.addEventListener('click', (e) => {
    // Only close if clicking directly on the overlay, not the content
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Prevent clicks inside modal content from closing the modal
  modalContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// Form Modal State
let currentEditingPlaylistId = null;
let songFormCount = 0;

/**
 * Opens the create playlist form
 */
function openCreateForm() {
  currentEditingPlaylistId = null;
  const formModal = document.querySelector('.form-modal-overlay');
  const formTitle = document.getElementById('formModalTitle');
  const saveButton = document.getElementById('savePlaylistBtn');

  formTitle.textContent = 'Create Playlist';
  saveButton.textContent = 'Save Playlist';

  // Reset form
  document.getElementById('playlistForm').reset();
  document.getElementById('songsList').innerHTML = '';
  songFormCount = 0;

  // Add one empty song field
  addSongField();

  // Show modal
  formModal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Opens the edit playlist form with pre-populated data
 * @param {Object} playlist - Playlist to edit
 */
function openEditForm(playlist) {
  currentEditingPlaylistId = playlist.id;
  const formModal = document.querySelector('.form-modal-overlay');
  const formTitle = document.getElementById('formModalTitle');
  const saveButton = document.getElementById('savePlaylistBtn');

  formTitle.textContent = 'Edit Playlist';
  saveButton.textContent = 'Update Playlist';

  // Populate form with existing data
  document.getElementById('playlistTitleInput').value = playlist.playlistTitle;
  document.getElementById('playlistCreatorInput').value = playlist.playlistCreator;
  document.getElementById('playlistDescriptionInput').value = playlist.description;
  document.getElementById('playlistCoverInput').value = playlist.playlistCoverUrl !== 'assets/img/playlist.png' ? playlist.playlistCoverUrl : '';

  // Clear and populate songs
  const songsList = document.getElementById('songsList');
  songsList.innerHTML = '';
  songFormCount = 0;

  playlist.songs.forEach(song => {
    addSongField(song);
  });

  // Show modal
  formModal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Closes the form modal
 */
function closeFormModal() {
  const formModal = document.querySelector('.form-modal-overlay');
  formModal.setAttribute('hidden', '');
  document.body.style.overflow = '';
  currentEditingPlaylistId = null;
}

/**
 * Adds a song field to the form
 * @param {Object} song - Optional song data to pre-populate
 */
function addSongField(song = null) {
  const songsList = document.getElementById('songsList');
  const songId = songFormCount++;

  const songItem = document.createElement('div');
  songItem.className = 'song-form-item';
  songItem.dataset.songId = songId;

  songItem.innerHTML = `
    <button type="button" class="remove-song-button" data-song-id="${songId}">
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
    <div class="song-form-row">
      <div class="song-form-field">
        <label>Song Title *</label>
        <input type="text" class="song-title-input" value="${song ? song.songTitle : ''}" required>
      </div>
      <div class="song-form-field">
        <label>Artist *</label>
        <input type="text" class="song-artist-input" value="${song ? song.artist : ''}" required>
      </div>
    </div>
    <div class="song-form-row">
      <div class="song-form-field">
        <label>Album</label>
        <input type="text" class="song-album-input" value="${song ? song.album : ''}">
      </div>
      <div class="song-form-field">
        <label>Duration (M:SS) *</label>
        <input type="text" class="song-duration-input" value="${song ? song.duration : ''}" placeholder="3:45" pattern="[0-9]+:[0-5][0-9]" title="Format: M:SS or MM:SS (e.g., 3:45)" required>
      </div>
    </div>
  `;

  songsList.appendChild(songItem);

  // Add remove button listener
  const removeButton = songItem.querySelector('.remove-song-button');
  removeButton.addEventListener('click', () => {
    songItem.remove();
  });
}

/**
 * Validates duration format (M:SS or MM:SS)
 * @param {string} duration - Duration string to validate
 * @returns {boolean} - True if valid format
 */
function validateDuration(duration) {
  const durationPattern = /^[0-9]+:[0-5][0-9]$/;
  return durationPattern.test(duration);
}

/**
 * Collects song data from the form
 * @returns {Array} Array of song objects
 */
function collectSongData() {
  const songItems = document.querySelectorAll('.song-form-item');
  const songs = [];
  let songId = 1;

  songItems.forEach(item => {
    const title = item.querySelector('.song-title-input').value.trim();
    const artist = item.querySelector('.song-artist-input').value.trim();
    const album = item.querySelector('.song-album-input').value.trim();
    const duration = item.querySelector('.song-duration-input').value.trim();

    if (title && artist) {
      songs.push({
        id: songId++,
        songTitle: title,
        artist: artist,
        album: album || 'Unknown Album',
        duration: duration,
        liked: false
      });
    }
  });

  return songs;
}

/**
 * Creates a new playlist
 * @param {Object} formData - Playlist data from form
 * @returns {Object} The newly created playlist
 */
function createPlaylist(formData) {
  // Generate new ID
  const maxId = Math.max(...data.map(p => p.id), 0);
  const newId = maxId + 1;

  const newPlaylist = {
    id: newId,
    playlistCoverUrl: formData.coverUrl || 'assets/img/playlist.png',
    playlistTitle: formData.title,
    playlistCreator: formData.creator,
    likeCount: 0,
    liked: false,
    description: formData.description,
    songs: formData.songs,
    dateAdded: new Date().toISOString() // Add timestamp for sorting
  };

  // Add to data array
  data.push(newPlaylist);

  // Re-render cards with current sort
  applySortAndRender();

  return newPlaylist;
}

/**
 * Updates an existing playlist
 * @param {number} playlistId - ID of playlist to update
 * @param {Object} formData - Updated playlist data
 * @returns {Object} The updated playlist
 */
function updatePlaylist(playlistId, formData) {
  const playlist = data.find(p => p.id === playlistId);

  if (!playlist) return null;

  // Update editable fields
  playlist.playlistTitle = formData.title;
  playlist.playlistCreator = formData.creator;
  playlist.description = formData.description;
  playlist.songs = formData.songs;
  if (formData.coverUrl) {
    playlist.playlistCoverUrl = formData.coverUrl;
  }

  // Re-render cards with current sort
  applySortAndRender();

  return playlist;
}

/**
 * Deletes a playlist from the data array
 * @param {number} playlistId - ID of playlist to delete
 */
function deletePlaylist(playlistId) {
  // Confirm deletion
  const playlist = data.find(p => p.id === playlistId);
  if (!playlist) return;

  const confirmed = confirm(`Are you sure you want to delete "${playlist.playlistTitle}"? This cannot be undone.`);

  if (!confirmed) return;

  // Find and remove playlist from data array
  const index = data.findIndex(p => p.id === playlistId);
  if (index !== -1) {
    data.splice(index, 1);
  }

  // Re-render cards with current sort
  applySortAndRender();
}

/**
 * Handles form submission
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('playlistTitleInput').value.trim();
  const creator = document.getElementById('playlistCreatorInput').value.trim();
  const description = document.getElementById('playlistDescriptionInput').value.trim();
  const coverUrl = document.getElementById('playlistCoverInput').value.trim();
  const songs = collectSongData();

  // Validation
  if (!title || !creator) {
    alert('Playlist title and creator are required');
    return;
  }

  if (songs.length === 0) {
    alert('Please add at least one song');
    return;
  }

  // Validate all song durations
  const songItems = document.querySelectorAll('.song-form-item');
  for (const item of songItems) {
    const duration = item.querySelector('.song-duration-input').value.trim();
    if (duration && !validateDuration(duration)) {
      alert(`Invalid duration format: "${duration}". Please use M:SS or MM:SS format (e.g., 3:45)`);
      return;
    }
  }

  const formData = { title, creator, description, coverUrl, songs };

  // Create or update
  if (currentEditingPlaylistId) {
    updatePlaylist(currentEditingPlaylistId, formData);
  } else {
    createPlaylist(formData);
  }

  closeFormModal();
}

/**
 * Sets up form modal event listeners
 */
function setupFormModalListeners() {
  const createBtn = document.getElementById('createPlaylistBtn');
  const cancelBtn = document.getElementById('cancelFormBtn');
  const addSongBtn = document.getElementById('addSongBtn');
  const playlistForm = document.getElementById('playlistForm');
  const formModalOverlay = document.querySelector('.form-modal-overlay');
  const formModalClose = document.querySelector('.form-modal-close');

  createBtn.addEventListener('click', openCreateForm);
  cancelBtn.addEventListener('click', closeFormModal);
  formModalClose.addEventListener('click', closeFormModal);
  addSongBtn.addEventListener('click', () => addSongField());
  playlistForm.addEventListener('submit', handleFormSubmit);

  // Close on overlay click
  formModalOverlay.addEventListener('click', (e) => {
    if (e.target === formModalOverlay) {
      closeFormModal();
    }
  });
}

/**
 * Sorts playlists by the given criteria
 * @param {Array} playlists - Array of playlist objects
 * @param {string} sortBy - Sort criteria: 'name', 'likes', or 'date'
 * @returns {Array} Sorted array of playlists
 */
function sortPlaylists(playlists, sortBy) {
  const sorted = [...playlists]; // Create a copy to avoid mutating original

  switch (sortBy) {
    case 'name':
      // Sort alphabetically by playlist title (A-Z)
      sorted.sort((a, b) => a.playlistTitle.localeCompare(b.playlistTitle));
      break;

    case 'likes':
      // Sort by like count (descending - highest first)
      sorted.sort((a, b) => b.likeCount - a.likeCount);
      break;

    case 'date':
      // Sort by date added (most recent first)
      sorted.sort((a, b) => {
        const dateA = new Date(a.dateAdded || 0);
        const dateB = new Date(b.dateAdded || 0);
        return dateB - dateA;
      });
      break;

    default:
      // No sorting, return as is
      return sorted;
  }

  return sorted;
}

/**
 * Applies current sort option and re-renders playlists
 */
function applySortAndRender() {
  const sortSelect = document.getElementById('sortSelect');
  const currentSort = sortSelect ? sortSelect.value : 'default';

  if (currentSort === 'default') {
    renderPlaylistCards(data);
  } else {
    const sorted = sortPlaylists(data, currentSort);
    renderPlaylistCards(sorted);
  }
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
      // Open the playlist modal
      openModal(result.playlist);

      // Clear search
      document.getElementById('searchInput').value = '';
      searchResults.setAttribute('hidden', '');
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

/**
 * Sets up sorting functionality
 */
function setupSorting() {
  const sortSelect = document.getElementById('sortSelect');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', () => {
    applySortAndRender();
  });
}

// Initialize the page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Add dateAdded field to existing playlists that don't have it
  data.forEach((playlist, index) => {
    if (!playlist.dateAdded) {
      // Simulate staggered dates for existing playlists (newest first in original order)
      const now = new Date();
      playlist.dateAdded = new Date(now.getTime() - (index * 24 * 60 * 60 * 1000)).toISOString();
    }
  });

  // Load liked songs from localStorage
  loadLikedSongs();

  // Render playlist cards from the data array
  renderPlaylistCards(data);

  // Setup modal event listeners
  setupModalListeners();

  // Setup form modal listeners
  setupFormModalListeners();

  // Setup search functionality
  setupSearch();

  // Setup sorting functionality
  setupSorting();

  // Check URL parameters for direct playlist link
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = urlParams.get('playlist');
  if (playlistId) {
    const playlist = data.find(p => p.id === parseInt(playlistId));
    if (playlist) {
      openModal(playlist);
    }
  }
});
