const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcrypt');
const saltRounds = 10;

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'AJSProject_001',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function createDB() {
    try {
        await pool.query(`CREATE DATABASE IF NOT EXISTS AJSProject_001 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await pool.query(`USE AJSProject_001`);
        console.log('Database ready');
    } catch (err) {
        console.error('DB creation failed:', err);
        throw err;
    }
}

async function createUserTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Users (
        userId INT AUTO_INCREMENT PRIMARY KEY,
        userEmail VARCHAR(100) NOT NULL UNIQUE,
        userName VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS UserSearches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        income BIGINT NOT NULL,
        countryCode VARCHAR(3) NOT NULL,
        countryName VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
      )
    `);


    await pool.query(`
    CREATE TABLE IF NOT EXISTS UserFeedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      feedBacks TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
    )
  `);


    console.log('Users and UserSearches tables ready');
}

async function insertUser(userEmail, userName, password) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [result] = await pool.query(
        'INSERT INTO Users (userEmail, userName, password) VALUES (?, ?, ?)',
        [userEmail, userName, hashedPassword]
    );
    return result;
}

async function getUserByEmail(userEmail) {
    const [rows] = await pool.query(
        'SELECT * FROM Users WHERE userEmail = ?',
        [userEmail]
    );
    return rows[0];
}

async function login(userEmail, password) {
    try {
        const user = await getUserByEmail(userEmail);
        if (!user)
            return 401;
        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch ? 200 : 401;
    } catch (err) {
        console.error('Login DB error:', err);
        return 500;
    }
}

async function saveUserSearch(userId, income, countryCode, countryName) {
    const [result] = await pool.query(
        'INSERT INTO UserSearches (userId, income,countryCode,countryName) VALUES (?, ?, ?, ?)',
        [userId, income, countryCode, countryName]
    );
    return result;
}

async function getUserSearches(userId) {
    const [rows] = await pool.query(
        `SELECT income, countryCode, countryName, createdAt
         FROM UserSearches
         WHERE userId = ?
         ORDER BY createdAt DESC`,
        [userId]
    );
    return rows;
}


async function saveUserFeedback(userId, feedback) {
    console.log(userId,feedback);
    const [result] = await pool.query(
        'INSERT INTO UserFeedback (userId, feedBacks) VALUES (?, ?)',
        [userId, feedback]
    );
    return result.id;
}




module.exports = {
    pool,
    createDB,
    createUserTable,
    insertUser,
    getUserByEmail,
    login,
    saveUserSearch,
    getUserSearches,
    saveUserFeedback
};
