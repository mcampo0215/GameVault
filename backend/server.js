
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
let db;
async function connectDatabase() {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✅ Connected to MySQL database');
        // Ensure schema has required auth/vault columns
        await ensureSchemaMigrations();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('💡 Make sure:');
        console.log('   1. MySQL is running');
        console.log('   2. Database "gamevault" exists');
        console.log('   3. Your credentials in .env are correct');
        process.exit(1);
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_gamevault_key';

async function ensureSchemaMigrations() {
    try {
        // Add password_hash column to vault_user if it doesn't exist
        const [cols] = await db.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'vault_user' AND COLUMN_NAME = 'password_hash'
        `, [process.env.DB_NAME]);

        if (cols.length === 0) {
            console.log('🛠️ Adding password_hash column to vault_user');
            await db.execute(`ALTER TABLE vault_user ADD COLUMN password_hash VARCHAR(255) NULL`);
        }

        // Add rating and comment columns to user_game if missing
        const [gameCols] = await db.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_game' AND COLUMN_NAME IN ('rating','comment')
        `, [process.env.DB_NAME]);

        const existing = gameCols.map(c => c.COLUMN_NAME);
        if (!existing.includes('rating')) {
            console.log('🛠️ Adding rating column to user_game');
            await db.execute(`ALTER TABLE user_game ADD COLUMN rating INT NULL`);
        }
        if (!existing.includes('comment')) {
            console.log('🛠️ Adding comment column to user_game');
            await db.execute(`ALTER TABLE user_game ADD COLUMN comment TEXT NULL`);
        }
        // Add background_image column to game table if missing
        const [gameCols2] = await db.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'game' AND COLUMN_NAME = 'background_image'
        `, [process.env.DB_NAME]);
        if (gameCols2.length === 0) {
            console.log('🛠️ Adding background_image column to game');
            await db.execute(`ALTER TABLE game ADD COLUMN background_image VARCHAR(512) NULL`);
        }
    } catch (err) {
        console.error('Error running schema migrations:', err.message);
    }
}

// Auth middleware
function authenticate(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// API Routes
app.get('/api/games', async (req, res) => {
    try {
        const [games] = await db.execute(`
            SELECT 
                g.game_id,
                g.background_image,
                g.title,
                g.rating,
                g.release_date,
                GROUP_CONCAT(DISTINCT gen.genre_name) as genres,
                GROUP_CONCAT(DISTINCT p.platform_name) as platforms
            FROM game g
            LEFT JOIN game_genre gg ON g.game_id = gg.game_id
            LEFT JOIN genre gen ON gg.genre_id = gen.genre_id
            LEFT JOIN game_platform gp ON g.game_id = gp.game_id
            LEFT JOIN platform p ON gp.platform_id = p.platform_id
            GROUP BY g.game_id
            ORDER BY g.title
        `);
        
        // Format the data for frontend
        const formattedGames = games.map(game => ({
            ...game,
            genres: game.genres ? game.genres.split(',') : [],
            platforms: game.platforms ? game.platforms.split(',') : []
        }));
        
        res.json(formattedGames);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT user_id, username 
            FROM vault_user 
            ORDER BY username
        `);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search users by username (for autocomplete/search box)
app.get('/api/users/search', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: 'username query param required' });

        const [users] = await db.execute(
            `SELECT user_id, username FROM vault_user WHERE username LIKE ? ORDER BY username LIMIT 50`,
            [`%${username}%`]
        );

        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Signup
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'username and password required' });

        // Check existing
        const [existing] = await db.execute(`SELECT user_id FROM vault_user WHERE username = ?`, [username]);
        if (existing.length > 0) return res.status(400).json({ error: 'Username already taken' });

        const hashed = await bcrypt.hash(password, 10);
        const [result] = await db.execute(`INSERT INTO vault_user (username, password_hash) VALUES (?, ?)`, [username, hashed]);
        const userId = result.insertId;
        const token = jwt.sign({ user_id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { user_id: userId, username } });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'username and password required' });

        const [rows] = await db.execute(`SELECT user_id, username, password_hash FROM vault_user WHERE username = ?`, [username]);
        if (rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

        const user = rows[0];
        if (!user.password_hash) return res.status(400).json({ error: 'This account has no password set' });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ user_id: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { user_id: user.user_id, username: user.username } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's vault by user id (public)
app.get('/api/users/:id/vault', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute(`
            SELECT ug.game_id, g.title, g.background_image, ug.game_status, ug.hours_played, ug.rating, ug.comment
            FROM user_game ug
            JOIN game g ON ug.game_id = g.game_id
            WHERE ug.user_id = ?
            ORDER BY ug.hours_played DESC
        `, [id]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching user vault:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add or update an entry in the authenticated user's vault
app.post('/api/me/vault', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { game_id, game_status, hours_played, rating, comment } = req.body;
        if (!game_id) return res.status(400).json({ error: 'game_id is required' });

        // Upsert into user_game
        await db.execute(`
            INSERT INTO user_game (user_id, game_id, game_status, hours_played, rating, comment)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                game_status = VALUES(game_status),
                hours_played = VALUES(hours_played),
                rating = VALUES(rating),
                comment = VALUES(comment)
        `, [userId, game_id, game_status || null, hours_played || 0, rating || null, comment || null]);

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating vault entry:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/:id/games', async (req, res) => {
    try {
        const [userGames] = await db.execute(`
            SELECT 
                g.game_id,
                g.title,
                ug.game_status,
                ug.hours_played
            FROM user_game ug
            JOIN game g ON ug.game_id = g.game_id
            WHERE ug.user_id = ?
            ORDER BY ug.hours_played DESC
        `, [req.params.id]);
        
        res.json(userGames);
    } catch (error) {
        console.error('Error fetching user games:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const [[{totalGames}]] = await db.execute('SELECT COUNT(*) as totalGames FROM game');
        const [[{totalUsers}]] = await db.execute('SELECT COUNT(*) as totalUsers FROM vault_user');
        
        const [[mostPlayed]] = await db.execute(`
            SELECT g.title 
            FROM user_game ug 
            JOIN game g ON ug.game_id = g.game_id 
            GROUP BY ug.game_id 
            ORDER BY SUM(ug.hours_played) DESC 
            LIMIT 1
        `);
        
        res.json({
            totalGames,
            totalUsers,
            mostPlayed: mostPlayed?.title || 'No data'
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'GameVault API is running' });
});

const PORT = process.env.PORT || 3000;

// Start server
async function startServer() {
    await connectDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints available:`);
        console.log(`   GET /api/health - Health check`);
        console.log(`   GET /api/games - All games`);
        console.log(`   GET /api/users - All users`);
        console.log(`   GET /api/stats - Dashboard stats`);
        console.log(`   GET /api/user/:id/games - User's game collection`);
    });
}
// Search games from RAWG API
app.get('/api/rawg/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        console.log(`Searching RAWG for: ${query}`);
        
        const response = await axios.get(
            `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=20`
        );
        
        const games = response.data.results.map(game => ({
            id: game.id,
            name: game.name,
            released: game.released,
            rating: game.rating,
            background_image: game.background_image,
            genres: game.genres.map(g => g.name),
            platforms: game.platforms.map(p => p.platform.name)
        }));
        
        console.log(`Found ${games.length} games for "${query}"`);
        res.json(games);
    } catch (error) {
        console.error('Error searching RAWG:', error);
        res.status(500).json({ error: 'Failed to search games' });
    }
});

// Add game from RAWG to your database
app.post('/api/games/add-from-rawg', async (req, res) => {
    try {
        const { rawgId } = req.body;
        
        if (!rawgId) {
            return res.status(400).json({ error: 'rawgId is required' });
        }

        console.log(`Adding game from RAWG ID: ${rawgId}`);
        
        // Get detailed game info from RAWG
        const response = await axios.get(
            `https://api.rawg.io/api/games/${rawgId}?key=${process.env.RAWG_API_KEY}`
        );
        
        const game = response.data;
        console.log(`Adding game: ${game.name}`);

        // Check if game already exists
        const [existingGame] = await db.execute(
            `SELECT game_id FROM game WHERE title = ?`,
            [game.name]
        );

        if (existingGame.length > 0) {
            const existingId = existingGame[0].game_id;
            // If existing record lacks a background_image, and RAWG provides one, update it
            const backgroundImage = game.background_image || game.background_image_additional || null;
            if (backgroundImage) {
                try {
                    await db.execute(`UPDATE game SET background_image = ? WHERE game_id = ? AND (background_image IS NULL OR background_image = '')`, [backgroundImage, existingId]);
                } catch (uerr) {
                    console.warn('Could not update existing game background_image', uerr.message);
                }
            }
            // Return success with existing gameId so client can continue
            return res.json({
                success: true,
                message: 'Game already exists',
                gameId: existingId
            });
        }

        // Insert into your database (include background image if available)
        const backgroundImage = game.background_image || game.background_image_additional || null;
        const [result] = await db.execute(
            `INSERT INTO game (title, rating, release_date, background_image) VALUES (?, ?, ?, ?)`,
            [game.name, game.rating, game.released, backgroundImage]
        );
        
        const gameId = result.insertId;
        console.log(`Created game with ID: ${gameId}`);

        // Add genres
        for (const genre of game.genres) {
            // Check if genre exists, if not create it
            let [genreResult] = await db.execute(
                `SELECT genre_id FROM genre WHERE genre_name = ?`,
                [genre.name]
            );
            
            let genreId;
            if (genreResult.length === 0) {
                [genreResult] = await db.execute(
                    `INSERT INTO genre (genre_name) VALUES (?)`,
                    [genre.name]
                );
                genreId = genreResult.insertId;
                console.log(`Created new genre: ${genre.name} (ID: ${genreId})`);
            } else {
                genreId = genreResult[0].genre_id;
            }
            
            await db.execute(
                `INSERT INTO game_genre (game_id, genre_id) VALUES (?, ?)`,
                [gameId, genreId]
            );
        }

        // Add platforms
        for (const platform of game.platforms) {
            // Check if platform exists, if not create it
            let [platformResult] = await db.execute(
                `SELECT platform_id FROM platform WHERE platform_name = ?`,
                [platform.platform.name]
            );
            
            let platformId;
            if (platformResult.length === 0) {
                [platformResult] = await db.execute(
                    `INSERT INTO platform (platform_name) VALUES (?)`,
                    [platform.platform.name]
                );
                platformId = platformResult.insertId;
                console.log(`Created new platform: ${platform.platform.name} (ID: ${platformId})`);
            } else {
                platformId = platformResult[0].platform_id;
            }
            
            await db.execute(
                `INSERT INTO game_platform (game_id, platform_id) VALUES (?, ?)`,
                [gameId, platformId]
            );
        }
        
        res.json({ 
            success: true, 
            message: `"${game.name}" added successfully to GameVault!`,
            gameId: gameId
        });
        
    } catch (error) {
        console.error('Error adding game:', error);
        res.status(500).json({ error: 'Failed to add game to database' });
    }
});
startServer().catch(console.error);