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
SELECT vault_user.user_id, vault_user.username, game.title
FROM vault_user
INNER JOIN user_game ON vault_user.user_id = user_game.user_id
INNER JOIN game ON user_game.game_id = game.game_id;

-- show all games along with their respective genres
SELECT game.game_id, game.title, GROUP_CONCAT(genre.genre_name ORDER BY genre.genre_name separator ', ') AS my_genre
FROM game
INNER JOIN game_genre ON game.game_id = game_genre.game_id
INNER JOIN genre ON game_genre.genre_id = genre.genre_id
GROUP BY game.game_id, game.title;

-- add a new column called price into the game table
ALTER TABLE game
ADD price DECIMAL(5, 2);

-- change the value of Grand Theft Auto V to $60.00
UPDATE game
SET price = 60.00
WHERE title = 'Grand Theft Auto V';

-- drop the previously added column
ALTER TABLE game
DROP COLUMN price;

-- change the game status of Grand Theft Auto V for user 1 to complete
UPDATE user_game
SET game_status = 'Complete'
WHERE game_id = (SELECT game_id FROM game
				 WHERE title = 'Grand Theft Auto V')
AND user_id = 1;

