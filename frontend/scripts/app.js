// API Base URL - Update this if your backend runs on a different port
const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const gamesGrid = document.getElementById('games-grid');
const usersList = document.getElementById('users-list');
const userGamesList = document.getElementById('user-games-list');
const userSelect = document.getElementById('user-select');
const gameSearch = document.getElementById('game-search');
const genreFilter = document.getElementById('genre-filter');
const platformFilter = document.getElementById('platform-filter');
const modal = document.getElementById('game-modal');
const closeModal = document.querySelector('.close');
// New DOM elements for auth and search
const userSearchInput = document.getElementById('user-search-input');
const userSearchResults = document.getElementById('user-search-results');
const userLookupInput = document.getElementById('user-lookup-input');
const userLookupButton = document.getElementById('user-lookup-button');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const signupUsername = document.getElementById('signup-username');
const signupPassword = document.getElementById('signup-password');
const signupButton = document.getElementById('signup-button');
const showSignupLink = document.getElementById('show-signup-link');
const showLoginLink = document.getElementById('show-login-link');
const myVaultGameSelect = document.getElementById('my-vault-game-select');
const myVaultStatus = document.getElementById('my-vault-status');
const myVaultHours = document.getElementById('my-vault-hours');
const myVaultRating = document.getElementById('my-vault-rating');
const myVaultComment = document.getElementById('my-vault-comment');
const myVaultAdd = document.getElementById('my-vault-add');
const myVaultList = document.getElementById('my-vault-list');
// Vault page elements (may be present on `my-vault.html`)
const vaultSearchInput = document.getElementById('vault-search-input');
const vaultSearchButton = document.getElementById('vault-search-button');
const vaultSearchResults = document.getElementById('vault-search-results');
const vaultListContainer = document.getElementById('vault-list');
const navAuthLink = document.getElementById('nav-auth-link');

// State
let allGames = [];
let allUsers = [];
let authToken = null;
let currentUser = null;

// Persistent auth keys
const AUTH_TOKEN_KEY = 'gv_token';
const AUTH_USER_KEY = 'gv_user';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadAuthFromStorage();
    loadDashboard();
    loadGames();
    loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    // Modal close (if present)
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => { modal.style.display = 'none'; });
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) modal.style.display = 'none';
        });
    }

    // Search and filter events (if present on the page)
    if (gameSearch) gameSearch.addEventListener('input', filterGames);
    if (genreFilter) genreFilter.addEventListener('change', filterGames);
    if (platformFilter) platformFilter.addEventListener('change', filterGames);
    if (userSelect) userSelect.addEventListener('change', loadUserGames);

    // New events
    if (userSearchInput) userSearchInput.addEventListener('input', debounce(handleUserSearch, 300));
    if (userLookupButton) userLookupButton.addEventListener('click', () => {
        const val = userLookupInput.value.trim();
        if (val) viewUserVaultByUsername(val);
    });

    // Auth event listeners
    if (loginButton) loginButton.addEventListener('click', login);
    if (signupButton) signupButton.addEventListener('click', signup);
    if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); showSignup(); });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

    if (myVaultAdd) myVaultAdd.addEventListener('click', addOrUpdateVaultEntry);

    // My Vault page listeners
    if (vaultSearchButton && vaultSearchInput) {
        vaultSearchButton.addEventListener('click', performVaultSearch);
        vaultSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performVaultSearch();
        });
    }
    // If the user is on My Vault page and logged in, load vault list
    if (vaultListContainer && currentUser) {
        loadMyVault();
    }
}

// Toggle helpers for login/signup cards
function showSignup() {
    const loginCard = document.getElementById('login-card');
    const signupCard = document.getElementById('signup-card');
    if (loginCard) loginCard.style.display = 'none';
    if (signupCard) signupCard.style.display = 'flex';
    // focus first field
    const su = document.getElementById('signup-username');
    if (su) su.focus();
}

function showLogin() {
    const loginCard = document.getElementById('login-card');
    const signupCard = document.getElementById('signup-card');
    if (signupCard) signupCard.style.display = 'none';
    if (loginCard) loginCard.style.display = 'flex';
    const lu = document.getElementById('login-username');
    if (lu) lu.focus();
}

async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const stats = await response.json();
        document.getElementById('total-games').textContent = stats.totalGames;
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('most-played').textContent = stats.mostPlayed;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('total-games').textContent = 'Error';
        document.getElementById('total-users').textContent = 'Error';
        document.getElementById('most-played').textContent = 'Error';
    }
}

async function loadGames() {
    try {
        const response = await fetch(`${API_BASE}/games`);
        if (!response.ok) throw new Error('Failed to fetch games');
        
        const games = await response.json();
        allGames = games;
        displayGames(games);
        populateFilters(games);
    } catch (error) {
        console.error('Error loading games:', error);
        gamesGrid.innerHTML = '<div class="loading">Error loading games. Make sure the backend server is running.</div>';
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        allUsers = users;
        displayUsers(users);
        populateUserSelect(users);
        populateMyVaultGameSelect();
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = '<div class="loading">Error loading users</div>';
    }
}

function displayGames(games) {
    if (games.length === 0) {
        gamesGrid.innerHTML = '<div class="loading">No games found</div>';
        return;
    }

    gamesGrid.innerHTML = games.map(game => `
        <div class="game-card" onclick="openGameModal(${game.game_id})">
            <h3>${game.title}</h3>
            <div class="game-meta">
                <span class="game-rating">⭐ ${game.rating}/5</span>
                <span>${new Date(game.release_date).getFullYear()}</span>
            </div>
            <div class="game-genres">
                ${game.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
            </div>
            <div class="game-platforms">
                <small>Platforms: ${game.platforms.join(', ')}</small>
            </div>
        </div>
    `).join('');
}

function displayUsers(users) {
    usersList.innerHTML = users.map(user => `
        <div class="user-card">
            <h3>${user.username}</h3>
            <p>User ID: ${user.user_id}</p>
        </div>
    `).join('');
}

function populateUserSelect(users) {
    userSelect.innerHTML = '<option value="">Select a user...</option>' +
        users.map(user => `
            <option value="${user.user_id}">${user.username} (ID: ${user.user_id})</option>
        `).join('');
}

function populateMyVaultGameSelect() {
    // Fill select with available games
    if (!myVaultGameSelect) return;
    myVaultGameSelect.innerHTML = '<option value="">Select a game</option>' +
        allGames.map(g => `<option value="${g.game_id}">${g.title}</option>`).join('');
}

async function loadUserGames() {
    const userId = userSelect.value;
    if (!userId) {
        userGamesList.innerHTML = '<div class="loading">Select a user to view their collection</div>';
        return;
    }

    try {
        userGamesList.innerHTML = '<div class="loading">Loading user games...</div>';
        
        const response = await fetch(`${API_BASE}/user/${userId}/games`);
        if (!response.ok) throw new Error('Failed to fetch user games');
        
        const userGames = await response.json();
        displayUserGames(userGames);
    } catch (error) {
        console.error('Error loading user games:', error);
        userGamesList.innerHTML = '<div class="loading">Error loading user games</div>';
    }
}

function displayUserGames(userGames) {
    if (userGames.length === 0) {
        userGamesList.innerHTML = '<div class="loading">No games in collection</div>';
        return;
    }

    userGamesList.innerHTML = userGames.map(game => `
        <div class="user-game-card status-${game.game_status.toLowerCase().replace(' ', '')}">
            <h4>${game.title}</h4>
            <p>Status: <strong>${game.game_status}</strong></p>
            <p>Hours Played: <strong>${game.hours_played}</strong></p>
        </div>
    `).join('');
}

function populateFilters(games) {
    // Extract unique genres and platforms
    const genres = [...new Set(games.flatMap(game => game.genres))].filter(Boolean).sort();
    const platforms = [...new Set(games.flatMap(game => game.platforms))].filter(Boolean).sort();

    genreFilter.innerHTML = '<option value="">All Genres</option>' +
        genres.map(genre => `<option value="${genre}">${genre}</option>`).join('');

    platformFilter.innerHTML = '<option value="">All Platforms</option>' +
        platforms.map(platform => `<option value="${platform}">${platform}</option>`).join('');
}

function filterGames() {
    const searchTerm = gameSearch.value.toLowerCase();
    const selectedGenre = genreFilter.value;
    const selectedPlatform = platformFilter.value;

    const filteredGames = allGames.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchTerm);
        const matchesGenre = !selectedGenre || game.genres.includes(selectedGenre);
        const matchesPlatform = !selectedPlatform || game.platforms.includes(selectedPlatform);

        return matchesSearch && matchesGenre && matchesPlatform;
    });

    displayGames(filteredGames);
}

function openGameModal(gameId) {
    const game = allGames.find(g => g.game_id === gameId);
    if (!game) return;

    const modalContent = document.getElementById('modal-game-details');
    modalContent.innerHTML = `
        <h2>${game.title}</h2>
        <div class="game-details">
            <p><strong>Rating:</strong> ⭐ ${game.rating}/5</p>
            <p><strong>Release Date:</strong> ${new Date(game.release_date).toLocaleDateString()}</p>
            <p><strong>Genres:</strong> ${game.genres.join(', ')}</p>
            <p><strong>Platforms:</strong> ${game.platforms.join(', ')}</p>
        </div>
    `;

    modal.style.display = 'block';
}

// Utility function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    // ... your existing code ...
    
    // Add search event listeners
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});

async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('Please enter a game name to search');
        return;
    }
    
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '<div class="loading-spinner">🔍 Searching games...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/rawg/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const games = await response.json();
        displaySearchResults(games);
    } catch (error) {
        console.error('Error searching games:', error);
        resultsContainer.innerHTML = `
            <div class="search-error">
                ❌ Failed to search games. Please try again.
            </div>
        `;
    }
}

function displaySearchResults(games) {
    const resultsContainer = document.getElementById('search-results');
    
    if (games.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                🎮 No games found. Try a different search term.
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = games.map(game => `
        <div class="search-result-card">
            ${game.background_image ? `
                <img src="${game.background_image}" alt="${game.name}" class="search-result-image">
            ` : `
                <div class="search-result-image" style="background: var(--gray); display: flex; align-items: center; justify-content: center; color: var(--text-light);">
                    🎮
                </div>
            `}
            <div class="search-result-content">
                <h4>${game.name}</h4>
                <div class="search-result-meta">
                    ${game.released ? `<span>📅 ${new Date(game.released).getFullYear()}</span>` : ''}
                    ${game.rating ? `<span>⭐ ${game.rating}/5</span>` : ''}
                </div>
                ${game.genres.length > 0 ? `
                    <div class="search-result-genres">
                        ${game.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                    </div>
                ` : ''}
                ${game.platforms.length > 0 ? `
                    <div style="font-size: 0.9rem; color: var(--text-light);">
                        🖥️ ${game.platforms.slice(0, 3).join(', ')}${game.platforms.length > 3 ? '...' : ''}
                    </div>
                ` : ''}
                <button class="add-game-button" onclick="addGameToDatabase(${game.id}, this)">
                    ➕ Add to GameVault
                </button>
            </div>
        </div>
    `).join('');
}

async function addGameToDatabase(rawgId, button) {
    // Disable button and show loading
    button.disabled = true;
    button.textContent = 'Adding...';
    
    try {
        const response = await fetch(`${API_BASE}/games/add-from-rawg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rawgId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            button.textContent = '✅ Added!';
            button.style.background = 'linear-gradient(135deg, #51cf66, #2ecc71)';
            
            // Refresh the games list after a short delay
            setTimeout(() => {
                loadGames();
                loadDashboard();
            }, 1000);
            
        } else {
            button.textContent = '❌ Failed';
            button.style.background = 'linear-gradient(135deg, #ff8787, #e74c3c)';
            setTimeout(() => {
                button.textContent = '➕ Add to GameVault';
                button.style.background = '';
                button.disabled = false;
            }, 2000);
            
            if (result.error === 'Game already exists in database') {
                alert('This game is already in your GameVault!');
            }
        }
    } catch (error) {
        console.error('Error adding game:', error);
        button.textContent = '❌ Error';
        button.style.background = 'linear-gradient(135deg, #ff8787, #e74c3c)';
        setTimeout(() => {
            button.textContent = '➕ Add to GameVault';
            button.style.background = '';
            button.disabled = false;
        }, 2000);
    }
}

// Debounce helper
function debounce(fn, wait) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

async function handleUserSearch(e) {
    const q = e.target.value.trim();
    if (!q) {
        userSearchResults.innerHTML = '<div class="loading">Search for users</div>';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/users/search?username=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error('Search failed');
        const users = await res.json();
        userSearchResults.innerHTML = users.map(u => `
            <div class="user-card clickable" data-id="${u.user_id}" data-username="${u.username}">
                <h3>${u.username}</h3>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.user-card.clickable').forEach(el => {
            el.addEventListener('click', () => {
                const username = el.getAttribute('data-username');
                viewUserVaultByUsername(username);
            });
        });
    } catch (err) {
        console.error('User search error:', err);
        userSearchResults.innerHTML = '<div class="loading">Search failed</div>';
    }
}

async function viewUserVaultByUsername(username) {
    try {
        // First find user id by searching
        const res = await fetch(`${API_BASE}/users/search?username=${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error('Failed to find user');
        const users = await res.json();
        const match = users.find(u => u.username.toLowerCase() === username.toLowerCase()) || users[0];
        if (!match) {
            userGamesList.innerHTML = '<div class="loading">User not found</div>';
            return;
        }
        const resp = await fetch(`${API_BASE}/users/${match.user_id}/vault`);
        if (!resp.ok) throw new Error('Failed to fetch vault');
        const vault = await resp.json();
        displayUserGames(vault);
    } catch (err) {
        console.error('Error viewing user vault:', err);
        userGamesList.innerHTML = '<div class="loading">Error loading user vault</div>';
    }
}

// Auth functions
async function signup() {
    const username = signupUsername && signupUsername.value ? signupUsername.value.trim() : '';
    const password = signupPassword && signupPassword.value ? signupPassword.value : '';
    if (!username || !password) return alert('Enter username and password');
    try {
        const res = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        // persist and redirect to home
        saveAuth(data.token, data.user);
        window.location.href = 'index.html';
    } catch (err) {
        alert(err.message || 'Signup error');
    }
}

async function login() {
    const username = loginUsername && loginUsername.value ? loginUsername.value.trim() : '';
    const password = loginPassword && loginPassword.value ? loginPassword.value : '';
    if (!username || !password) return alert('Enter username and password');
    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        // persist and redirect to home
        saveAuth(data.token, data.user);
        window.location.href = 'index.html';
    } catch (err) {
        alert(err.message || 'Login error');
    }
}

// Save auth token + user to localStorage and memory
function saveAuth(token, user) {
    authToken = token;
    currentUser = user;
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (e) {
        console.warn('Could not persist auth to localStorage', e);
    }
    updateNavAuthLink();
}

function loadAuthFromStorage() {
    try {
        const t = localStorage.getItem(AUTH_TOKEN_KEY);
        const u = localStorage.getItem(AUTH_USER_KEY);
        if (t && u) {
            authToken = t;
            currentUser = JSON.parse(u);
            // If user is already logged in, pre-populate my vault on pages that have it
            populateAfterLogin();
            updateNavAuthLink();
        }
    } catch (e) {
        console.warn('Failed to load auth from storage', e);
    }
}

function populateAfterLogin() {
    // Refresh my vault and game select
    populateMyVaultGameSelect();
    loadMyVault();
}

async function loadMyVault() {
    const container = vaultListContainer || myVaultList;
    if (!currentUser) {
        if (container) container.innerHTML = '<div class="loading">Login to view your vault</div>';
        return;
    }
    if (!container) return; // nothing to render to on this page
    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.user_id}/vault`);
        if (!res.ok) throw new Error('Failed to fetch vault');
        const vault = await res.json();
        container.innerHTML = vault.length === 0 ? '<div class="loading">No games in your vault</div>' :
            vault.map(e => `
                <div class="vault-entry">
                    <div style="display:flex;gap:12px;align-items:flex-start">
                        ${e.background_image ? `<img src="${e.background_image}" alt="${e.title}" style="width:96px;height:96px;object-fit:cover;border-radius:8px">` : `<div style="width:96px;height:96px;background:var(--gray);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-light)">🎮</div>`}
                        <div class="meta">
                            <h4 style="margin:0 0 6px 0">${e.title}</h4>
                            <div class="vault-meta">
                                <div><strong>Status:</strong> ${e.game_status || '—'}</div>
                                <div><strong>Hours:</strong> ${e.hours_played || 0}</div>
                                <div><strong>Rating:</strong> ${e.rating || '-'}</div>
                            </div>
                            ${e.comment ? `<p style="margin-top:0.6rem">${e.comment}</p>` : ''}
                        </div>
                        <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
                            <button class="tiny-btn edit-btn" data-game-id="${e.game_id}">Edit</button>
                        </div>
                    </div>
                    <script type="application/json" class="vault-entry-data">${JSON.stringify(e)}</script>
                </div>
            `).join('');

        // Attach edit button listeners so user can modify entries
        container.querySelectorAll('.vault-entry .edit-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const wrapper = ev.target.closest('.vault-entry');
                if (!wrapper) return;
                const dataScript = wrapper.querySelector('.vault-entry-data');
                if (!dataScript) return;
                try {
                    const entry = JSON.parse(dataScript.textContent);
                    showEditPanelForEntry(entry);
                } catch (err) {
                    console.error('Failed to parse vault entry data', err);
                }
            });
        });

        // Attach click-to-enlarge for entry images
        container.querySelectorAll('.vault-entry img').forEach(img => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', (ev) => {
                const wrapper = ev.target.closest('.vault-entry');
                if (!wrapper) return;
                const dataScript = wrapper.querySelector('.vault-entry-data');
                if (!dataScript) return;
                try {
                    const entry = JSON.parse(dataScript.textContent);
                    if (entry && (entry.background_image || entry.background_image_additional)) {
                        const url = entry.background_image || entry.background_image_additional;
                        showImageModal(url, entry.title || 'Cover');
                    }
                } catch (err) {
                    console.error('Failed to parse vault entry data for image modal', err);
                }
            });
        });
    } catch (err) {
        console.error('Error loading my vault:', err);
        container.innerHTML = '<div class="loading">Error loading your vault</div>';
    }
}

async function addOrUpdateVaultEntry() {
    if (!currentUser || !authToken) return alert('Login first');
    const game_id = myVaultGameSelect.value;
    if (!game_id) return alert('Select a game');
    const payload = {
        game_id: parseInt(game_id, 10),
        game_status: myVaultStatus.value,
        hours_played: parseInt(myVaultHours.value || '0', 10),
        rating: myVaultRating.value ? parseInt(myVaultRating.value, 10) : null,
        comment: myVaultComment.value || null
    };
    try {
        const res = await fetch(`${API_BASE}/me/vault`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        alert('Saved to your vault');
        loadMyVault();
    } catch (err) {
        alert(err.message || 'Error saving entry');
    }
}

// My Vault: search RAWG and render results with inline add-to-vault form
async function performVaultSearch() {
    const q = vaultSearchInput ? vaultSearchInput.value.trim() : '';
    if (!q) return alert('Please enter a game name to search');
    if (!vaultSearchResults) return;
    vaultSearchResults.innerHTML = '<div class="loading-spinner">🔍 Searching games...</div>';

    try {
        const response = await fetch(`${API_BASE}/rawg/search?query=${encodeURIComponent(q)}`);
        if (!response.ok) throw new Error('Search failed');
        const games = await response.json();
        renderVaultSearchResults(games);
    } catch (err) {
        console.error('Vault search failed', err);
        vaultSearchResults.innerHTML = '<div class="search-error">❌ Failed to search games</div>';
    }
}

function renderVaultSearchResults(games) {
    if (!vaultSearchResults) return;
    if (!games || games.length === 0) {
        vaultSearchResults.innerHTML = '<div class="search-placeholder">No games found</div>';
        return;
    }

    vaultSearchResults.innerHTML = games.map(game => `
        <div class="search-result-card">
            ${game.background_image ? `<img src="${game.background_image}" alt="${game.name}" class="search-result-image">` : `<div class="search-result-image" style="background:var(--gray);display:flex;align-items:center;justify-content:center;color:var(--text-light)">🎮</div>`}
            <div class="search-result-content">
                <h4>${game.name}</h4>
                <div class="search-result-meta">${game.released ? `📅 ${new Date(game.released).getFullYear()}` : ''} ${game.rating ? ` • ⭐ ${game.rating}` : ''}</div>
                <div class="add-to-vault-row">
                    <select id="status-${game.id}" class="small-select">
                        <option value="playing">Playing</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                    </select>
                    <input id="hours-${game.id}" class="small-input" placeholder="Hours" type="number" min="0" />
                    <input id="rating-${game.id}" class="small-input" placeholder="Rating (1-5)" type="number" min="1" max="5" />
                    <input id="comment-${game.id}" class="small-input" placeholder="Optional comment" />
                    <button class="tiny-btn" id="addbtn-${game.id}" onclick="addToVaultFromRawg(${game.id})">Add to Vault</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Add game (from RAWG) to DB if needed, then add to the authenticated user's vault
async function addToVaultFromRawg(rawgId) {
    if (!authToken || !currentUser) return alert('Please login first');
    const btn = document.getElementById(`addbtn-${rawgId}`);
    if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }

    try {
        // Ensure game exists in our DB
        const addResp = await fetch(`${API_BASE}/games/add-from-rawg`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rawgId })
        });
        const addJson = await addResp.json().catch(() => ({}));
        let gameId = null;
        if (addResp.ok && addJson.gameId) gameId = addJson.gameId;
        // backend may respond with 400 but include gameId when already exists
        if (!gameId && addJson.gameId) gameId = addJson.gameId;
        if (!gameId) {
            // either addResp.ok and no gameId, or failed without gameId -> try to search by name fallback (not ideal)
            console.warn('Could not get gameId from add-from-rawg response', addJson);
            if (btn) { btn.textContent = 'Error'; setTimeout(() => { btn.textContent = 'Add to Vault'; btn.disabled = false; }, 1500); }
            return alert('Failed to add or locate game in database');
        }

        // read inline form values
        const statusEl = document.getElementById(`status-${rawgId}`);
        const hoursEl = document.getElementById(`hours-${rawgId}`);
        const ratingEl = document.getElementById(`rating-${rawgId}`);
        const commentEl = document.getElementById(`comment-${rawgId}`);
        const payload = {
            game_id: parseInt(gameId, 10),
            game_status: statusEl ? statusEl.value : null,
            hours_played: hoursEl && hoursEl.value ? parseInt(hoursEl.value, 10) : 0,
            rating: ratingEl && ratingEl.value ? parseInt(ratingEl.value, 10) : null,
            comment: commentEl ? commentEl.value : null
        };

        const res = await fetch(`${API_BASE}/me/vault`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, body: JSON.stringify(payload)
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || 'Failed to save to vault');
        if (btn) { btn.textContent = 'Added'; btn.style.background = 'linear-gradient(135deg,#51cf66,#2ecc71)'; }
        // refresh vault list
        await loadMyVault();
    } catch (err) {
        console.error('Error adding to vault', err);
        if (btn) { btn.textContent = 'Error'; setTimeout(() => { btn.textContent = 'Add to Vault'; btn.disabled = false; }, 1500); }
        alert(err.message || 'Error adding to vault');
    }
}

function updateNavAuthLink() {
    if (!navAuthLink) return;
    if (currentUser) {
        // Show a friendly fixed label and keep username as tooltip
        navAuthLink.textContent = 'MyVault';
        navAuthLink.href = 'my-vault.html';
        navAuthLink.title = currentUser.username || '';
    } else {
        navAuthLink.textContent = 'Login / Signup';
        navAuthLink.href = 'login.html';
    }
}

function clearAuth() {
    authToken = null; currentUser = null;
    try { localStorage.removeItem(AUTH_TOKEN_KEY); localStorage.removeItem(AUTH_USER_KEY); } catch(e){}
    updateNavAuthLink();
}

// show avatar/initials and wire logout control
function updateNavUserControls(){
    const navUser = document.getElementById('nav-user');
    const navAvatar = document.getElementById('nav-avatar');
    const navLogout = document.getElementById('nav-logout');
    if (!navUser) return;
    if (currentUser) {
        // set initials
        const name = currentUser.username || '';
        const initials = name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();
        if (navAvatar) { navAvatar.textContent = initials; navAvatar.title = name; navAvatar.style.display = 'inline-flex'; }
        navUser.hidden = false;
        if (navLogout) {
            navLogout.style.display = 'inline-block';
            navLogout.onclick = () => { clearAuth(); window.location.href = 'login.html'; };
        }
    } else {
        if (navUser) navUser.hidden = true;
        if (navAvatar) { navAvatar.textContent = ''; navAvatar.title = ''; }
        if (navLogout) navLogout.onclick = null;
    }
}

// call updateNavUserControls whenever nav is updated
const originalUpdateNavAuthLink = updateNavAuthLink;
updateNavAuthLink = function(){ originalUpdateNavAuthLink(); updateNavUserControls(); };

// --- My Vault Add panel behaviors ---
document.addEventListener('DOMContentLoaded', function(){
    const addBtn = document.getElementById('vault-add-btn');
    const addPanel = document.getElementById('vault-add-panel');
    const addClose = document.getElementById('vault-add-close');
    const addSearchInput = document.getElementById('vault-add-search');
    const addSearchBtn = document.getElementById('vault-add-search-btn');
    const addResults = document.getElementById('vault-add-results');
    const addBackdrop = addPanel ? addPanel.querySelector('.vault-add-backdrop') : null;

    // Ensure panel is closed by default (use .open class for visibility)
    if (addPanel) { addPanel.classList.remove('open'); document.body.style.overflow = ''; }

    function showAddPanel(show){
        if (!addPanel) return;
        if (show){
            addPanel.classList.add('open');
            // lock scroll
            document.body.style.overflow = 'hidden';
            if (addSearchInput) addSearchInput.focus();
            // trap escape to close
            document.addEventListener('keydown', escHandler);
        } else {
            addPanel.classList.remove('open');
            document.body.style.overflow = '';
            if (addResults) addResults.innerHTML = '';
            if (addSearchInput) addSearchInput.value = '';
            document.removeEventListener('keydown', escHandler);
        }
    }

    function escHandler(e){ if (e.key === 'Escape') showAddPanel(false); }

    if (addBtn) addBtn.addEventListener('click', function(e){ e.preventDefault(); showAddPanel(true); });
    if (addClose) addClose.addEventListener('click', function(e){ e.preventDefault(); showAddPanel(false); });
    if (addBackdrop) addBackdrop.addEventListener('click', function(){ showAddPanel(false); });
    if (addSearchBtn && addSearchInput) addSearchBtn.addEventListener('click', function(e){
        e.preventDefault();
        const q = addSearchInput.value && addSearchInput.value.trim();
        if (!q) return;
        performAddSearch(q);
    });
    if (addSearchInput) addSearchInput.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); addSearchBtn.click(); } });

    async function performAddSearch(query){
        if (!addResults) return;
        addResults.innerHTML = '<div class="loading">Searching…</div>';
            try{
                const res = await fetch(`${API_BASE}/rawg/search?query=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();
                // backend may return an array or an object with a `results` array
                const items = Array.isArray(data) ? data : (data && data.results ? data.results : []);
                renderAddSearchResults(items);
            }catch(err){
                addResults.innerHTML = '<div class="error">Search error</div>';
                console.error('RAWG search error', err);
            }
    }

    function renderAddSearchResults(items){
        if (!addResults) return;
        addResults.innerHTML = '';
        if (!items || items.length === 0){ addResults.innerHTML = '<div class="empty">No results</div>'; return; }
        items.forEach(it => {
            const div = document.createElement('div');
            div.className = 'vault-add-result';
            const img = document.createElement('img');
            img.src = it.background_image || it.background_image_additional || '';
            img.alt = it.name || 'cover';
            const info = document.createElement('div'); info.className = 'info';
            const h4 = document.createElement('h4'); h4.textContent = it.name || 'Unknown';
            const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = it.released ? `Released: ${it.released}` : '';
            info.appendChild(h4); info.appendChild(sub);
            const actions = document.createElement('div'); actions.className = 'actions';
            // Create inline add-to-vault controls: status, hours, rating, comment, and Add button
            const addRow = document.createElement('div'); addRow.className = 'add-to-vault-row';
            addRow.innerHTML = `
                <select id="status-${it.id}" class="small-select">
                    <option value="playing">Playing</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                </select>
                <input id="hours-${it.id}" class="small-input" placeholder="Hours" type="number" min="0" />
                <input id="rating-${it.id}" class="small-input" placeholder="Rating (1-5)" type="number" min="1" max="5" />
                <input id="comment-${it.id}" class="small-input" placeholder="Optional comment" />
            `;

            const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.id = `addbtn-${it.id}`; addBtn.textContent = 'Add';
            addBtn.addEventListener('click', async function(){
                // Use existing helper to add by RAWG id
                try{
                    await addToVaultFromRawg(it.id);
                    // Refresh vault list if available
                    loadMyVault();
                    showAddPanel(false);
                }catch(e){ console.error('Add failed', e); }
            });
            actions.appendChild(addRow);
            actions.appendChild(addBtn);
            div.appendChild(img);
            div.appendChild(info);
            div.appendChild(actions);
            addResults.appendChild(div);
        });
    }
});

// Edit panel functions (exposed globally so loadMyVault can open it)
window.showEditPanelForEntry = function(entry){
    const panel = document.getElementById('vault-edit-panel');
    const title = document.getElementById('vault-edit-title');
    const statusEl = document.getElementById('vault-edit-status');
    const hoursEl = document.getElementById('vault-edit-hours');
    const ratingEl = document.getElementById('vault-edit-rating');
    const commentEl = document.getElementById('vault-edit-comment');
    const preview = document.getElementById('vault-edit-preview');
    if (!panel) return;
    window._currentVaultEdit = entry;
    title.textContent = `Edit: ${entry.title}`;
    if (statusEl) statusEl.value = entry.game_status || 'playing';
    if (hoursEl) hoursEl.value = entry.hours_played || 0;
    if (ratingEl) ratingEl.value = entry.rating || '';
    if (commentEl) commentEl.value = entry.comment || '';
    if (preview) preview.innerHTML = entry.background_image ? `<div style="padding:12px"><img src="${entry.background_image}" style="width:120px;height:120px;object-fit:cover;border-radius:8px"></div>` : '';
    panel.classList.add('open'); document.body.style.overflow = 'hidden';
    // attach save/close handlers
    const saveBtn = document.getElementById('vault-edit-save');
    const closeBtn = document.getElementById('vault-edit-close');
    if (closeBtn) closeBtn.onclick = () => { hideEditPanel(); };
    if (saveBtn) saveBtn.onclick = async () => {
        if (!window._currentVaultEdit) return;
        if (!currentUser || !authToken) return alert('Please login first');
        const payload = {
            game_id: window._currentVaultEdit.game_id,
            game_status: statusEl ? statusEl.value : null,
            hours_played: hoursEl && hoursEl.value ? parseInt(hoursEl.value, 10) : 0,
            rating: ratingEl && ratingEl.value ? parseInt(ratingEl.value, 10) : null,
            comment: commentEl ? commentEl.value : null
        };
        try{
            const res = await fetch(`${API_BASE}/me/vault`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(payload)
            });
            const j = await res.json().catch(()=>({}));
            if (!res.ok) throw new Error(j.error || 'Failed to save');
            hideEditPanel();
            await loadMyVault();
        }catch(err){
            console.error('Error saving vault edit', err);
            alert(err.message || 'Failed to save entry');
        }
    };
    // attach escape handler to close edit panel
    document.addEventListener('keydown', _gvEditPanelEscHandler);
};

function hideEditPanel(){
    const panel = document.getElementById('vault-edit-panel');
    if (!panel) return;
    panel.classList.remove('open');
    document.body.style.overflow = '';
    window._currentVaultEdit = null;
}

// Escape handler for edit panel
function _gvEditPanelEscHandler(e){
    if (e.key === 'Escape') hideEditPanel();
}

// Image modal (click to enlarge)
window.showImageModal = function(url, title){
    if (!url) return;
    let overlay = document.getElementById('gv-image-modal');
    if (!overlay){
        overlay = document.createElement('div');
        overlay.id = 'gv-image-modal';
        overlay.style.position = 'fixed';
        overlay.style.left = 0;
        overlay.style.top = 0;
        overlay.style.right = 0;
        overlay.style.bottom = 0;
        overlay.style.background = 'rgba(8,12,28,0.75)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = 9999;
        overlay.innerHTML = `
            <div style="max-width:90vw;max-height:90vh;position:relative;border-radius:12px;overflow:hidden">
                <img id="gv-image-modal-img" src="" alt="" style="display:block;max-width:100%;max-height:90vh;object-fit:contain;background:#fff" />
                <button id="gv-image-modal-close" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:6px;padding:6px 8px;cursor:pointer">✕</button>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e)=>{ if (e.target === overlay) hideImageModal(); });
        const closeBtn = overlay.querySelector('#gv-image-modal-close');
        if (closeBtn) closeBtn.addEventListener('click', hideImageModal);
    }
    const img = document.getElementById('gv-image-modal-img');
    if (img){ img.src = url; img.alt = title || 'Cover'; }
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // add escape key listener to close modal
    document.addEventListener('keydown', _gvImageModalEscHandler);
}

function hideImageModal(){
    const overlay = document.getElementById('gv-image-modal');
    if (!overlay) return;
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    // remove escape listener
    document.removeEventListener('keydown', _gvImageModalEscHandler);
}

// Close image modal on Escape key
function _gvImageModalEscHandler(e){
    if (e.key === 'Escape') hideImageModal();
}