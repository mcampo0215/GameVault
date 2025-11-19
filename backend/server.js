
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

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
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('💡 Make sure:');
        console.log('   1. MySQL is running');
        console.log('   2. Database "gamevault" exists');
        console.log('   3. Your credentials in .env are correct');
        process.exit(1);
    }
}

// API Routes
app.get('/api/games', async (req, res) => {
    try {
        const [games] = await db.execute(`
            SELECT 
                g.game_id,
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

startServer().catch(console.error);