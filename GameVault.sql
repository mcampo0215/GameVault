-- creating gamevault database
DROP DATABASE IF EXISTS gamevault;
CREATE DATABASE gamevault;

-- selecting gamevault database
USE gamevault;

-- drop user table if already exists, else create it
DROP TABLE IF EXISTS user;
CREATE TABLE vault_user (
    user_id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL
);

-- drop genre table if already exists, else create it
DROP TABLE IF EXISTS genre;
CREATE TABLE genre (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    genre_name VARCHAR(50) NOT NULL
);

-- drop platform table if already eists, else create it
DROP TABLE IF EXISTS platform;
CREATE TABLE platform (
    platform_id INT AUTO_INCREMENT PRIMARY KEY,
    platform_name VARCHAR(100) NOT NULL
);

-- drop developers table if already exists, else create it
DROP TABLE IF EXISTS developers;
CREATE TABLE developers (
    developers_id INT AUTO_INCREMENT PRIMARY KEY,
    developers_name VARCHAR(100) NOT NULL
);

-- drop publishers table if already exists, else create it
DROP TABLE IF EXISTS publishers;
CREATE TABLE publishers (
    publishers_id INT AUTO_INCREMENT PRIMARY KEY,
    publishers_name VARCHAR(100) NOT NULL
);

-- drop game table if already exists, else create it
DROP TABLE IF EXISTS game;
CREATE TABLE game (
    game_id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    title VARCHAR(255) NOT NULL,
    rating DECIMAL(5,2),
    release_date DATE
);

-- drop user_game table if already exists, else create it
DROP TABLE IF EXISTS user_game;
CREATE TABLE user_game (
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    game_status VARCHAR(50),
    hours_played INT,
    PRIMARY KEY (user_id , game_id),
    CONSTRAINT user_id_fk FOREIGN KEY (user_id)
        REFERENCES vault_user (user_id),
    CONSTRAINT game_id_fk FOREIGN KEY (game_id)
        REFERENCES game (game_id)
);

-- drop game_genre table if already exists, else create it
DROP TABLE IF EXISTS game_genre;
CREATE TABLE game_genre (
	game_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (game_id, genre_id),
    CONSTRAINT game_genre_fk FOREIGN KEY (game_id)
		REFERENCES game (game_id),
	CONSTRAINT genre_id_fk FOREIGN KEY (genre_id)
		REFERENCES genre (genre_id)
);
-- drop game_platform table if already exists, else create it
DROP TABLE IF EXISTS game_platform;
CREATE TABLE game_platform (
    game_id INT NOT NULL,
    platform_id INT NOT NULL,
    PRIMARY KEY (game_id , platform_id),
    CONSTRAINT game_id_fk2 FOREIGN KEY (game_id)
        REFERENCES game (game_id),
    CONSTRAINT platform_id_fk FOREIGN KEY (platform_id)
        REFERENCES platform (platform_id)
);

-- drop game_developers table is already exists, else create it
DROP TABLE IF EXISTS game_developers;
CREATE TABLE game_developers (
    game_id INT NOT NULL,
    developers_id INT NOT NULL,
    PRIMARY KEY (game_id , developers_id),
    CONSTRAINT game_id_fk3 FOREIGN KEY (game_id)
        REFERENCES game (game_id),
    CONSTRAINT developers_id_fk FOREIGN KEY (developers_id)
        REFERENCES developers (developers_id)
);

-- drop game_publishers table if already exists, else create it
DROP TABLE IF EXISTS game_publishers;
CREATE TABLE game_publishers (
	game_id INT NOT NULL,
    publishers_id INT NOT NULL,
    PRIMARY KEY(game_id, publishers_id),
    CONSTRAINT game_id_fk4 FOREIGN KEY (game_id)
		REFERENCES game (game_id),
	CONSTRAINT publishers_id_fk FOREIGN KEY (publishers_id)
		REFERENCES publishers (publishers_id)
);

-- insert values into user table
INSERT INTO vault_user (username) VALUES
('SILENTRAMPXGE-'),
('plumS'),
('ShadowViper'),
('LunarKnight'),
('ZeroShift'),
('SHAWN'),
('idk_bored'),
('AlloyKnight'),
('OmegaDrift'),
('RetroFury'),
('Thelunatic_2000'),
('EmberKnight'),
('ZeroSpecter');

-- insert values into genre table
INSERT INTO genre (genre_name) VALUES
('Action'),
('Indie'),
('Adventure'),
('RPG'),
('Strategy'),
('Shooter'),
('Casual'),
('Simulation'),
('Puzzle'),
('Arcade'),
('Platformer'),
('Massively Multiplayer'),
('Racing'),
('Sports'),
('Fighting'),
('Family'),
('Board Games'),
('Card'),
('Educational');

-- insert values into platform table
INSERT INTO platform (platform_name) VALUES
('PlayStation 5'),
('PlayStation 4'),
('Xbox One'),
('Xbox Series S/X'),
('Nintendo Switch'),
('PC'),
('PlayStation 3'),
('Xbox 360'),
('Linux'),
('macOS');

-- insert values into developers table
INSERT INTO developers (developers_name) VALUES
('Rockstar North'),
('Rockstar Games'),
('CD PROJEKT RED'),
('Valve Software'),
('Hidden Path Entertainment'),
('Crystal Dynamics'),
('NVIDIA Lightspeed Studios'),
('Turtle Rock Studios'),
('Bethseda Game Studios'),
('Aspyr Media'),
('2K Australia'),
('Irrational Games');

-- insert values into publishers table
INSERT INTO publishers (publishers_name) VALUES
('2K Games'),
('Aspyr'),
('Rockstar Games'),
('Bethesda Softworks'),
('Electronic Arts'),
('Valve'),
('Akella'),
('Buka Entertainment'),
('NVIDIA'),
('CyberFront'),
('Square Enix'),
('CD PROJEKT RED');

-- insert values into game table
INSERT INTO game (title, rating, release_date) VALUES
('Grand Theft Auto V', 4.47, '2013-09-17'),
('The Witcher 3: Wild Hunt', 4.64, '2015-05-18'),
('Portal 2', 4.58, '2011-04-18'),
('Counter-Strike: Global Offensive', 3.57, '2012-08-21'),
('Tomb Raider (2013)', 4.06, '2013-03-05'),
('Portal', 4.49, '2007-10-09'),
('Left 4 Dead 2', 4.09, '2009-11-17'),
('The Elder Scrolls V: Skyrim', 4.42, '2011-11-11'),
('Red Dead Redemption 2', 4.59, '2018-10-26'),
('BioShock Infinite', 4.38, '2013-03-26'),
('Half-Life 2', 4.48, '2004-11-16'),
('Borderlands 2', 4.01, '2012-09-18'),
('Life is Strange', 4.12, '2015-01-29'),
('BioShock', 4.36, '2007-08-21'),
('Destiny 2', 3.52, '2017-09-06'),
('God of War (2018)', 4.55, '2018-04-20'),
('Fallout 4', 3.81, '2015-11-09'),
('PAYDAY 2', 3.52, '2013-08-13'),
('Limbo', 4.14, '2010-07-21'),
('Team Fortress 2', 3.68, '2007-10-10'),
('DOOM (2016)', 4.38, '2016-05-12'),
('Cyberpunk 2077', 4.22, '2020-12-10'),
('Terraria', 4.07, '2011-05-16'),
('Dota 2', 3.07, '2013-07-09'),
('Warframe', 3.42, '2013-03-25'),
('Grand Thef Auto IV', 4.26, '2008-04-29'),
('Rocket League', 3.93, '2015-07-07'),
('Horizon Zero Dawn', 4.28, '2017-02-28'),
('Metro 2033', 3.94, '2010-03-16'),
('Rise of the Tomb Raider', 4.04, '2015-11-10');

-- insert values into user_game table
INSERT INTO user_game (user_id, game_id, game_status, hours_played) VALUES
(1, 1, 'In progress', 7),
(1, 4, 'Complete', 45),
(2, 5, 'Complete', 75),
(3, 1, 'Complete', 120),
(3, 6, 'In progress', 5),
(3, 8, 'In progress', 67),
(4, 10, 'Complete', 35),
(4, 9, 'In progress', 47),
(4, 17, 'Complete', 85),
(5, 1, 'Complete', 130),
(5, 30, 'In progress', 99),
(5, 18, 'In progress', 57),
(5, 29, 'Complete', 112),
(6, 3, 'Complete', 88),
(6, 1, 'Incomplete', 12),
(6, 9, 'Incomplete', 2);



-- insert values into game_genre table

-- insert values into game_platform table

-- insert values into game_developers table

-- insert values into game_publishers table


