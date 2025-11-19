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

// State
let allGames = [];
let allUsers = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    loadGames();
    loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    // Modal close
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Search and filter events
    gameSearch.addEventListener('input', filterGames);
    genreFilter.addEventListener('change', filterGames);
    platformFilter.addEventListener('change', filterGames);
    userSelect.addEventListener('change', loadUserGames);
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