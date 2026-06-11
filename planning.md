## Music Playlist Explorer — Planning Spec

### Data Schema

playlist:
- id (number) — unique identifier for the playlist
- playlistCoverUrl (string) — URL or path to the playlist cover image
- playlistTitle (string) — display name of the playlist
- playlistCreator (string) — name of the user who created the playlist
- likeCount (number) — total number of likes the playlist has received
- liked (boolean) — whether the current user has liked this playlist
- description (string) — descriptive text explaining the playlist's theme or mood
- songs (array) — collection of song objects belonging to this playlist

song:
- id (number) — unique identifier for the song
- songTitle (string) — display name of the track
- artist (string) — name of the performing artist
- album (string) — name of the album the song appears on
- duration (string) — length of the song in "M:SS" format (e.g., "3:45")

### UI and Interaction Rules

#### Main Sections
The homepage is divided into three main sections:

1. **Sidebar (left)** — Contains navigation links and branding. Fixed position so it remains visible during scroll.

2. **Main Content Area (center)** — Displays the playlist grid. This is the primary scrollable region containing playlist cards arranged in a responsive grid layout.

3. **Header (top of main content)** — Contains search/filter controls and greeting text. Sticky or fixed so it remains accessible when scrolling through playlists.

#### Playlist Card Interaction
When a user clicks a playlist card:
- A modal overlay appears centered on the screen
- The modal displays the full playlist details: cover art, title, description, track list, and playlist actions
- The background behind the modal is darkened with a semi-transparent overlay
- The rest of the page becomes non-interactive (clicks are captured by the modal layer)
- The modal includes a close button (X icon in top-right corner)

#### Modal Dismissal
When a user clicks outside the modal (on the darkened overlay):
- The modal closes with a smooth fade-out animation
- The user returns to the main playlist grid
- Focus returns to the previously selected card or the main content area

Clicking the X button in the modal has the same effect.

#### Like/Favorite Interaction
When a user clicks the heart/like icon on a playlist card:
- The icon toggles between outlined (unliked) and filled (liked) states
- The visual change is immediate (optimistic update)
- Liked playlists can be filtered or sorted differently in the UI
- The like state persists across sessions (stored locally or server-side)

#### Shuffle Button
When a user clicks the shuffle button:
- The current playlist's tracks are randomized
- Playback begins with the first track in the new shuffled order
- A visual indicator shows that shuffle mode is active
- The button state toggles (active/inactive) to show current shuffle status

This behavior applies when the shuffle button appears in the playlist detail modal or in a now-playing control area.

### Function Specs

#### `renderPlaylistCards(playlists)` — Milestone 3
**What it takes in:** An array of playlist objects matching the data schema  
**What it returns:** Nothing (void) — directly manipulates the DOM  
**What DOM element it appends to:** `.playlist-cards` container  
**Fields used from playlist object:**
- `playlistCoverUrl` — displayed as card cover image
- `playlistTitle` — displayed as card heading
- `playlistCreator` — displayed as creator attribution text
- `likeCount` — displayed as like count with icon
- `id` — used as data attribute for click handling

**Behavior:** Iterates over the playlists array, creates a card element for each playlist with all visual components (cover, title, creator, like count, play button), and appends each card to the playlist-cards container. If the array is empty, displays a "No playlists found" message.

#### `populateModal(playlist)` — Milestone 4
**What it takes in:** A single playlist object matching the data schema  
**Which DOM elements it updates:**
- `.modal-cover` — playlist cover image
- `.modal-title` — playlist title text
- `.modal-creator` — playlist creator text
- `.modal-description` — playlist description text
- `.song-list` — container for song items (cleared and repopulated)

**What the modal should look like after running:**
- Large cover image displayed prominently
- Playlist title, creator, and description all visible
- Complete list of songs rendered with proper formatting
- Each song shows: number, title, artist, album, duration
- Modal is ready to be shown (content populated but visibility handled separately)

**Information present:**
- All playlist metadata (title, creator, description, cover)
- Complete tracklist with all song details from the songs array

#### `toggleLike(playlistId, likeButton, likeCountElement)` — Milestone 5
**What it takes in:**
- `playlistId` (number) — unique identifier for the playlist being liked/unliked
- `likeButton` (HTMLElement) — the like button DOM element to update visually
- `likeCountElement` (HTMLElement) — the element displaying the like count text

**Branch 1: Unliked → Liked**
- **Data model change:** Increment `playlist.likeCount` by 1, set `playlist.liked = true`
- **DOM changes:** 
  - Add `liked` class to like button (fills heart icon)
  - Update like count text to new value
  - Apply color change (gray → green) via CSS class

**Branch 2: Liked → Unliked**
- **Data model change:** Decrement `playlist.likeCount` by 1, set `playlist.liked = false`
- **DOM changes:**
  - Remove `liked` class from like button (outlines heart icon)
  - Update like count text to new value
  - Remove color change (green → gray) via CSS class

**Constraint:** Each playlist object tracks its `liked` state as a boolean flag. The function checks this flag to determine which branch to execute, ensuring a user can only like once at a time (toggle behavior).

#### `shuffleSongs(songs)` — Milestone 6
**What it takes in:** An array of song objects from a playlist

**What it returns:** A new array containing the same songs in randomized order

**Original order preservation:** 
- The original `playlist.songs` array in the data model is never modified
- A shallow copy of the songs array is created before shuffling
- This preserves the original order so users can refresh/reopen the modal to see the default order

**UI after shuffling:**
- Song list in the modal displays in the new randomized order
- Song numbers (1, 2, 3...) remain sequential but correspond to the new shuffled positions
- No visual indicator of shuffle state (songs simply appear in new order)

**Multi-shuffle behavior:**
- Each shuffle click creates a fresh random order from the original song array
- Multiple clicks produce different orders each time
- No "undo" or "return to original" — closing and reopening the modal resets to original order

#### `selectRandomPlaylist(playlists)` — Milestone 7
**What it takes in:** An array of all available playlist objects

**What it returns:** A single randomly selected playlist object

**When it runs:** On DOMContentLoaded event when the featured page loads

**Behavior:** Generates a random index using `Math.random() * playlists.length`, floors the result, and returns the playlist at that index. Each page load produces an independent random selection.

#### `getPlaylistDescription(playlist)` — Milestone 8
**What it takes in:** A single playlist object with title, creator, and songs array

**What it returns:** A Promise that resolves to a string (either the AI-generated description or the fallback error message)

**API call details:**
- **Endpoint:** OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)
- **Model:** `meta-llama/llama-3.1-8b-instruct:free` (free tier model)
- **Prompt structure:**
  ```
  System: [Role from AI Feature Spec]
  User: Generate a description for this playlist:
  Title: {playlist.playlistTitle}
  Creator: {playlist.playlistCreator}
  Songs: {formatted song list with title - artist}
  ```
- **Headers:** Authorization with API key, Content-Type application/json

**Error handling:**
- Catches network errors, API errors, or empty responses
- Returns fallback message: "Unable to generate description at this time. Please try again later."
- Does not throw errors — always returns a string for consistent UI handling

### Featured Page (Milestone 7)

#### Layout
The Featured page follows the same three-section layout as the main page:

1. **Sidebar (left)** — Same navigation as main page, with links to "Home" (All Playlists) and "Featured"
2. **Main Content Area (center)** — Displays a single featured playlist prominently:
   - Large hero section with playlist cover, title, creator, and description
   - Full tracklist displayed below the hero
   - Play and like buttons for interaction
3. **Header (top)** — Same header as main page with greeting and search

**Visual Design:** The featured playlist should feel like a spotlight — larger cover image, bold typography, and prominent call-to-action buttons. Similar to Spotify's "Daily Mix" or "Made For You" presentation.

#### Navigation
- Sidebar contains two navigation links: "Home" and "Featured"
- "Home" link navigates to `index.html` (all playlists page)
- "Featured" link navigates to `featured.html` (featured page)
- Active page link is highlighted with the `active` class
- No need for browser back/forward — navigation is explicit via links

#### `selectRandomPlaylist(playlists)` — Featured Page
**What it takes in:** An array of all available playlist objects

**What it returns:** A single randomly selected playlist object

**When it runs:** Every time the featured page loads or is refreshed in the browser

**Randomization approach:** 
- Uses `Math.random()` to generate a random index within the playlists array bounds
- No caching or "seen" tracking — each page load is independent
- Same playlist may appear multiple times across different page loads (true random)

**Behavior:** Selects one playlist at random and populates the featured page hero section and tracklist with that playlist's data.

### AI Feature Spec (Milestone 8)

#### Role
You are a music curator and playlist expert who writes engaging, vivid descriptions that capture the mood and theme of playlists.

#### Task
Generate a compelling 2-3 sentence description for a music playlist based on its title, creator, and tracklist. The description should convey the vibe, emotional tone, and ideal use case for the playlist without simply listing songs or using generic marketing language.

#### Inputs
- Playlist title (string)
- Playlist creator (string)
- Song list (array of objects with songTitle, artist, album fields)

#### Output Format
- 2-3 sentences that capture the playlist's vibe and theme
- Written in second person ("you") or descriptive style
- Focuses on mood, atmosphere, and when/why someone would listen
- Natural, conversational tone (not promotional or overly formal)

#### Constraints
- Do NOT list individual songs by name
- Do NOT use generic marketing phrases like "perfect for", "ultimate collection", "hand-picked selection"
- Do NOT mention the number of songs
- Do NOT address the creator by name
- Keep it concise (under 100 words)

#### Failure Behavior
If the API call fails or returns an empty/invalid response, display:
"Unable to generate description at this time. Please try again later."

This message should appear in the same location where the generated description would display.

### Stretch Features

#### Playlist Management (Create & Edit)

**Create Playlist Flow:**
1. User clicks "Create Playlist" button in header
2. Modal opens with empty form
3. User fills in: playlist title, creator name, description
4. User adds songs via "Add Song" button (each song: title, artist, album, duration)
5. User clicks "Save Playlist" to create playlist
6. New playlist appears in grid with default cover image
7. Modal closes automatically

**Edit Playlist Flow:**
1. User clicks edit icon on playlist card
2. Modal opens with form pre-populated with existing playlist data
3. User can modify: title, creator, description, songs (add/remove/edit)
4. User clicks "Update Playlist" to save changes
5. Card updates in real-time with new data
6. Modal closes automatically

**Data Persistence:**
- Changes persist in the `data` array in memory
- No backend/localStorage (future enhancement)
- Page refresh resets to original data.js content

**Validation:**
- Playlist title is required
- Creator name is required
- At least one song is required
- Song title and artist are required for each song
- Duration must be in "M:SS" format

#### `createPlaylist(formData)` — Stretch Feature
**What it takes in:** Object with playlist fields (title, creator, description, songs array)

**What it returns:** The newly created playlist object with generated ID

**Behavior:**
- Generates new unique ID (max existing ID + 1)
- Sets default values: `liked: false`, `likeCount: 0`, `playlistCoverUrl: 'assets/img/playlist.png'`
- Adds playlist to `data` array
- Re-renders playlist grid
- Returns the created playlist

#### `updatePlaylist(playlistId, formData)` — Stretch Feature
**What it takes in:** Playlist ID and object with updated fields

**What it returns:** The updated playlist object

**Behavior:**
- Finds playlist in `data` array by ID
- Updates all editable fields (title, creator, description, songs)
- Preserves non-editable fields (id, liked, likeCount, coverUrl)
- Re-renders playlist grid
- Returns the updated playlist

### Decisions Log

#### Milestone 3: Dynamic Playlist Rendering
- **Decision:** Created `data.js` file instead of fetching `data.json` to avoid CORS issues during local development
- **Decision:** Implemented a helper function `createPlaylistCard()` separate from `renderPlaylistCards()` for better code organization and reusability
- **Decision:** Added image fallback handling in case playlist cover images fail to load, defaulting to `assets/img/playlist.png`
- **Decision:** Used `dataset.playlistId` attribute on cards to enable easy click handling in future milestones
- **Decision:** Implemented "No playlists found" message for empty data array to provide user feedback

#### Milestone 4: Modal Functionality
- **Decision:** Separated `populateModal()` from `openModal()` to follow single-responsibility principle — one function handles data population, the other handles visibility
- **Decision:** Added click event listeners directly in `createPlaylistCard()` so each card is self-contained with its interaction behavior
- **Decision:** Implemented Escape key support for closing modal to improve accessibility and match user expectations
- **Decision:** Added `body` overflow control to prevent background scrolling when modal is open, matching standard modal UX patterns
- **Decision:** Used event propagation control (`stopPropagation`) to ensure clicks inside modal content don't trigger overlay close handler

#### Milestone 5: Like Functionality
- **Decision:** Added `liked` boolean field to playlist data schema to track like state per playlist
- **Decision:** Used `stopPropagation()` on like button clicks to prevent triggering the card's modal open handler
- **Decision:** Applied CSS `liked` class to like buttons for visual state management (filled heart vs outline)
- **Decision:** Synchronized like state between card and modal — clicking either updates both the data model and all UI instances
- **Decision:** Used node cloning technique (`cloneNode`) to replace modal like button and remove old event listeners before adding new ones, preventing listener accumulation across modal opens

#### Milestone 6: Shuffle Functionality
- **Decision:** Implemented Fisher-Yates shuffle algorithm for true randomization with uniform distribution
- **Decision:** Used spread operator (`[...songs]`) to create shallow copy before shuffling, preserving original order in data model
- **Decision:** Extracted `renderSongList()` as separate function for reusability between initial render and shuffle updates
- **Decision:** Each shuffle creates new random order from original array (not re-shuffling previous shuffle) for better UX
- **Decision:** Used node cloning technique on shuffle button to prevent event listener accumulation across modal opens
- **Decision:** No visual shuffle state indicator — closing/reopening modal resets to original order as implicit "reset"

#### Milestone 7: Featured Page
- **Decision:** Created separate `featured.html` and `featured.js` files to keep featured page logic isolated from main page
- **Decision:** Used hero layout with large (300x300px) cover image and 72px title for visual emphasis
- **Decision:** Implemented `selectRandomPlaylist()` using `Math.random()` for true randomness on each page load
- **Decision:** Stored current featured playlist in `window.currentFeaturedPlaylist` to enable like and shuffle functionality
- **Decision:** Reused Fisher-Yates shuffle algorithm from Milestone 6 for consistency
- **Decision:** Updated navigation to use proper HTML links (`index.html`, `featured.html`) instead of hash links
- **Decision:** Applied `active` class based on current page for visual feedback in navigation
- **Decision:** No caching or "seen" tracking — each page refresh can show the same playlist (true independent random selection)

#### Milestone 8: AI-Powered Descriptions
**Initial test results:**
- First API call with basic prompt produced output that was too generic and included phrases like "perfect for" which violated the constraint
- Model correctly avoided listing individual songs by name
- Description length was appropriate (2-3 sentences, under 100 words)

**Prompt adjustments made:**
1. Added explicit constraint in user prompt: "Do NOT use generic marketing phrases"
2. Strengthened system role to emphasize "engaging, vivid descriptions" rather than just "descriptions"
3. Added "Keep it under 100 words" as explicit instruction
4. Emphasized "vibe, emotional tone, and ideal use case" in user prompt to guide output quality

**Failure state testing:**
- Tested with invalid API key → correctly showed fallback message
- Tested with network offline → correctly caught error and showed fallback message
- Tested with malformed response → safely handled with optional chaining (`?.`)

**What I'd specify differently:**
- Would add example descriptions in the system prompt to better guide tone and style
- Would specify avoiding ALL-CAPS or excessive punctuation (!!!) as additional constraint
- Would request that descriptions start with action words or sensory language rather than "This playlist..." format

**Technical decisions:**
- Used `async/await` for cleaner error handling compared to promise chains
- Stored API key directly in code (acceptable for free tier, would use env vars in production)
- Applied three CSS classes (`.loading`, `.error`, default) for visual state feedback
- Disabled button during API call to prevent duplicate requests
- Used optional chaining (`?.`) for safe property access on API response
- Logged errors to console for debugging while showing user-friendly fallback message

#### Stretch Features: Playlist Management
**Create Playlist:**
- Added "Create Playlist" button to header with green Spotify-style button
- Opens form modal with empty fields
- User can add multiple songs with "Add Song" button
- Each song field has remove button (X icon) for deletion
- Default cover image (`assets/img/playlist.png`) assigned to new playlists
- New ID generated as `max(existing IDs) + 1`

**Edit Playlist:**
- Added edit icon (pencil) to top-right of each playlist card
- Icon appears on hover for clean UI
- Opens same form modal pre-populated with existing data
- All songs from playlist loaded into form
- Updates playlist in data array and re-renders grid

**Form Modal Design:**
- Separate modal overlay (z-index 2000) to appear above playlist detail modal
- Two-column grid for song fields (title/artist, album/duration)
- Form validation: title, creator, and at least one song required
- Song fields nested in gray boxes for visual grouping
- Cancel/Save buttons with distinct styling

**Technical Decisions:**
- Used `currentEditingPlaylistId` to track create vs edit mode
- Used `songFormCount` counter for unique song field IDs
- Used `data-song-id` attributes for targeted song removal
- Applied `e.stopPropagation()` on edit button to prevent card modal opening
- Re-render entire playlist grid after create/update for consistency
- No localStorage persistence — changes lost on page refresh (noted in spec as future enhancement)
- Used native form validation with `required` attributes
- Used `alert()` for validation errors (simple UX, could be enhanced with inline errors)