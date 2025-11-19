-- get information from vault_user table
SELECT * FROM vault_user;

-- get all information from the game table, ordered by game_id
SELECT * FROM game
ORDER BY game_id;

-- get all game titles with a rating greater than 4
SELECT title, rating
FROM game
WHERE rating > 4;

-- find the number of completed games in the user_game table
SELECT COUNT(game_id) AS completed_games_count
FROM user_game
WHERE game_status = 'Complete';

-- show the games where their rating is above average
SELECT title, rating
FROM game
WHERE rating > (
	SELECT AVG(rating)
    FROM game);

-- show all user information along with games played
SELECT vu.user_id, vu.username, g.title
FROM vault_user vu
LEFT JOIN user_game ug
	ON vu.user_id = ug.user_id
LEFT JOIN game g
	on ug.game_id = g.game_id;