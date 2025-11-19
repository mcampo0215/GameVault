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
    developers_name VARCHAR(100) NOT NULL UNIQUE
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
    rating DECIMAL(5, 2),
    release_date DATE
);

-- drop user_game table if already exists, else create it
DROP TABLE IF EXISTS user_game;

CREATE TABLE user_game (
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    game_status VARCHAR(50),
    hours_played INT,
    PRIMARY KEY (user_id, game_id),
    CONSTRAINT user_id_fk FOREIGN KEY (user_id) REFERENCES vault_user (user_id),
    CONSTRAINT game_id_fk FOREIGN KEY (game_id) REFERENCES game (game_id)
);

-- drop game_genre table if already exists, else create it
DROP TABLE IF EXISTS game_genre;

CREATE TABLE game_genre (
    game_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (game_id, genre_id),
    CONSTRAINT game_genre_fk FOREIGN KEY (game_id) REFERENCES game (game_id),
    CONSTRAINT genre_id_fk FOREIGN KEY (genre_id) REFERENCES genre (genre_id)
);
-- drop game_platform table if already exists, else create it
DROP TABLE IF EXISTS game_platform;

CREATE TABLE game_platform (
    game_id INT NOT NULL,
    platform_id INT NOT NULL,
    PRIMARY KEY (game_id, platform_id),
    CONSTRAINT game_id_fk2 FOREIGN KEY (game_id) REFERENCES game (game_id),
    CONSTRAINT platform_id_fk FOREIGN KEY (platform_id) REFERENCES platform (platform_id)
);

-- drop game_developers table is already exists, else create it
DROP TABLE IF EXISTS game_developers;

CREATE TABLE game_developers (
    game_id INT NOT NULL,
    developers_id INT NOT NULL,
    PRIMARY KEY (game_id, developers_id),
    CONSTRAINT game_id_fk3 FOREIGN KEY (game_id) REFERENCES game (game_id),
    CONSTRAINT developers_id_fk FOREIGN KEY (developers_id) REFERENCES developers (developers_id)
);

-- drop game_publishers table if already exists, else create it
DROP TABLE IF EXISTS game_publishers;

CREATE TABLE game_publishers (
    game_id INT NOT NULL,
    publishers_id INT NOT NULL,
    PRIMARY KEY (game_id, publishers_id),
    CONSTRAINT game_id_fk4 FOREIGN KEY (game_id) REFERENCES game (game_id),
    CONSTRAINT publishers_id_fk FOREIGN KEY (publishers_id) REFERENCES publishers (publishers_id)
);

-- insert values into user table
INSERT INTO
    vault_user (username)
VALUES ('SILENTRAMPXGE-'),
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
INSERT INTO
    genre (genre_name)
VALUES ('Action'),
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
INSERT INTO
    platform (platform_name)
VALUES ('PlayStation 5'),
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
INSERT INTO
    developers (developers_name)
VALUES ('Rockstar North'),
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
    ('Irrational Games'),
    ('2K'),
    ('Gearbox Software'),
    (
        'Sony Computer Entertainment America'
    ),
    ('DONTNOT Entertainment'),
    ('Digital Extremes'),
    ('2K Marin'),
    ('2K China'),
    ('Bungie'),
    ('Santa Monica Studio'),
    ('505 Games'),
    ('OVERKILL Software'),
    ('Double Eleven'),
    ('Playdead'),
    ('鱼俞'),
    ('Bethesda Softworks'),
    ('Panic Button'),
    ('Tango Gameworks'),
    ('Escalation Studios'),
    ('Certain Affinity'),
    ('Digital Domain'),
    ('BattleCry Studios'),
    ('id Software'),
    ('CD PROJEKT'),
    ('Engine Software'),
    ('Codeglue'),
    ('Pipeworks Studio'),
    ('Re-logic'),
    ('Psyonix'),
    ('Guerilla Games'),
    ('4A Games'),
    ('Feral Interactive'),
    ('Nixxes');

-- insert values into publishers table
INSERT INTO
    publishers (publishers_name)
VALUES ('2K Games'),
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
INSERT INTO
    game (title, rating, release_date)
VALUES (
        'Grand Theft Auto V',
        4.47,
        '2013-09-17'
    ),
    (
        'The Witcher 3: Wild Hunt',
        4.64,
        '2015-05-18'
    ),
    (
        'Portal 2',
        4.58,
        '2011-04-18'
    ),
    (
        'Counter-Strike: Global Offensive',
        3.57,
        '2012-08-21'
    ),
    (
        'Tomb Raider (2013)',
        4.06,
        '2013-03-05'
    ),
    ('Portal', 4.49, '2007-10-09'),
    (
        'Left 4 Dead 2',
        4.09,
        '2009-11-17'
    ),
    (
        'The Elder Scrolls V: Skyrim',
        4.42,
        '2011-11-11'
    ),
    (
        'Red Dead Redemption 2',
        4.59,
        '2018-10-26'
    ),
    (
        'BioShock Infinite',
        4.38,
        '2013-03-26'
    ),
    (
        'Half-Life 2',
        4.48,
        '2004-11-16'
    ),
    (
        'Borderlands 2',
        4.01,
        '2012-09-18'
    ),
    (
        'Life is Strange',
        4.12,
        '2015-01-29'
    ),
    (
        'BioShock',
        4.36,
        '2007-08-21'
    ),
    (
        'Destiny 2',
        3.52,
        '2017-09-06'
    ),
    (
        'God of War (2018)',
        4.55,
        '2018-04-20'
    ),
    (
        'Fallout 4',
        3.81,
        '2015-11-09'
    ),
    (
        'PAYDAY 2',
        3.52,
        '2013-08-13'
    ),
    ('Limbo', 4.14, '2010-07-21'),
    (
        'Team Fortress 2',
        3.68,
        '2007-10-10'
    ),
    (
        'DOOM (2016)',
        4.38,
        '2016-05-12'
    ),
    (
        'Cyberpunk 2077',
        4.22,
        '2020-12-10'
    ),
    (
        'Terraria',
        4.07,
        '2011-05-16'
    ),
    ('Dota 2', 3.07, '2013-07-09'),
    (
        'Warframe',
        3.42,
        '2013-03-25'
    ),
    (
        'Grand Thef Auto IV',
        4.26,
        '2008-04-29'
    ),
    (
        'Rocket League',
        3.93,
        '2015-07-07'
    ),
    (
        'Horizon Zero Dawn',
        4.28,
        '2017-02-28'
    ),
    (
        'Metro 2033',
        3.94,
        '2010-03-16'
    ),
    (
        'Rise of the Tomb Raider',
        4.04,
        '2015-11-10'
    );

-- insert values into user_game table
INSERT INTO
    user_game (
        user_id,
        game_id,
        game_status,
        hours_played
    )
VALUES (1, 1, 'In progress', 7),
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
    (6, 9, 'Incomplete', 2),
    (7, 12, 'Complete', 150),
    (7, 5, 'Incomplete', 28),
    (8, 14, 'Complete', 88),
    (8, 15, 'Complete', 98),
    (8, 24, 'Complete', 123),
    (9, 22, 'Incomplete', 55),
    (9, 27, 'Complete', 149),
    (9, 1, 'Incomplete', 32),
    (10, 29, 'Incomplete', 2),
    (10, 16, 'Complete', 119),
    (10, 2, 'Complete', 120),
    (11, 11, 'Incomplete', 19),
    (11, 13, 'Incomplete', 2),
    (11, 30, 'Complete', 200),
    (12, 9, 'Complete', 168),
    (12, 10, 'Complete', 112),
    (12, 1, 'Complete', 365),
    (13, 4, 'Incomplete', 52),
    (13, 16, 'Incomplete', 30),
    (13, 19, 'Complete', 199);

-- insert values into game_genre table
INSERT INTO
    game_genre (game_id, genre_id)
VALUES (1, 1),
    (2, 1),
    (2, 4),
    (3, 6),
    (3, 9),
    (4, 6),
    (5, 1),
    (6, 1),
    (6, 9),
    (7, 1),
    (7, 6),
    (8, 1),
    (8, 4),
    (9, 1),
    (10, 1),
    (10, 6),
    (11, 1),
    (11, 6),
    (12, 1),
    (12, 6),
    (12, 4),
    (13, 10),
    (14, 1),
    (14, 6),
    (15, 1),
    (15, 6),
    (16, 1),
    (17, 1),
    (17, 4),
    (18, 1),
    (18, 6),
    (19, 1),
    (19, 3),
    (19, 2),
    (19, 9),
    (19, 11),
    (20, 1),
    (20, 6),
    (21, 1),
    (21, 6),
    (22, 1),
    (22, 6),
    (22, 4),
    (23, 1),
    (23, 2),
    (23, 11),
    (24, 1),
    (24, 12),
    (25, 1),
    (25, 6),
    (25, 4),
    (25, 12),
    (26, 1),
    (27, 14),
    (27, 13),
    (27, 2),
    (28, 1),
    (28, 4),
    (29, 1),
    (29, 6),
    (30, 1);

-- insert values into game_platform table
INSERT INTO
    game_platform (game_id, platform_id)
VALUES (1, 6),
    (1, 1),
    (1, 2),
    (1, 3),
    (1, 4),
    (1, 8),
    (1, 7),
    (2, 1),
    (2, 2),
    (2, 3),
    (2, 4),
    (2, 5),
    (2, 6),
    (2, 10),
    (3, 1),
    (3, 2),
    (3, 10),
    (3, 3),
    (3, 4),
    (3, 5),
    (4, 7),
    (4, 6),
    (4, 10),
    (4, 8),
    (4, 9),
    (4, 3),
    (5, 6),
    (5, 8),
    (5, 9),
    (5, 7),
    (6, 10),
    (6, 2),
    (6, 7),
    (6, 8),
    (6, 6),
    (6, 3),
    (6, 5),
    (7, 8),
    (7, 9),
    (7, 6),
    (7, 10),
    (8, 4),
    (8, 6),
    (8, 1),
    (8, 2),
    (8, 3),
    (8, 5),
    (8, 7),
    (8, 8),
    (9, 2),
    (9, 3),
    (9, 6),
    (10, 2),
    (10, 5),
    (10, 8),
    (10, 6),
    (10, 9),
    (10, 7),
    (10, 3),
    (11, 6),
    (11, 10),
    (11, 8),
    (11, 9),
    (12, 7),
    (12, 10),
    (12, 6),
    (12, 9),
    (12, 8),
    (13, 6),
    (13, 9),
    (13, 7),
    (13, 8),
    (13, 2),
    (14, 7),
    (14, 8),
    (14, 10),
    (14, 6),
    (15, 2),
    (15, 3),
    (15, 6),
    (15, 4),
    (15, 1),
    (16, 6),
    (16, 2),
    (17, 2),
    (17, 1),
    (17, 6),
    (17, 3),
    (18, 9),
    (18, 6),
    (18, 3),
    (19, 6),
    (19, 2),
    (19, 7),
    (19, 8),
    (19, 5),
    (19, 3),
    (20, 6),
    (20, 10),
    (20, 9),
    (21, 6),
    (21, 2),
    (21, 5),
    (21, 3),
    (22, 5),
    (22, 2),
    (22, 6),
    (22, 3),
    (22, 4),
    (22, 1),
    (23, 2),
    (23, 8),
    (23, 3),
    (23, 10),
    (23, 5),
    (23, 7),
    (23, 9),
    (24, 6),
    (24, 9),
    (24, 10),
    (25, 1),
    (25, 2),
    (25, 3),
    (25, 5),
    (25, 6),
    (26, 8),
    (26, 6),
    (26, 7),
    (26, 3),
    (27, 5),
    (27, 9),
    (27, 10),
    (27, 2),
    (27, 3),
    (27, 6),
    (28, 6),
    (28, 2),
    (29, 8),
    (29, 6),
    (30, 3),
    (30, 6),
    (30, 10),
    (30, 2);

-- insert values into game_developers table

-- insert values into game_publishers table