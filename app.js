require('dotenv').config();

const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const { createDB, createUserTable, getUserByEmail, insertUser, login, saveUserSearch, getUserSearches, saveUserFeedback } = require('./public/script/DB.js');

const app = express();
const port = process.env.PORT || 3000;
const lifeTime = (60 * 60 * 1000);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/views'));

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function initDB() {
    try {
        await createDB();
        await createUserTable();
        console.log('DB initialized');
    } catch (err) {
        console.error('DB init failed:', err);
        throw err;
    }
}

function verify(req, res, next) {
    const JWToken = req.cookies.JWToken;
    if (!JWToken) {
        res.render("Auth", { title: "Login", directTo: "/signup", content: "Create new account" });
        return;
    }
    try {
        const decoded = jwt.verify(JWToken, process.env.secret);
        console.log('Verified user:', decoded.email);
        req.user = decoded;
        next();
    } catch (err) {
        console.log('JWT verify failed:', err.message);
        res.render("Auth", { title: "Login", directTo: "/signup", content: "Create new account" });
    }
}

app.get('/', verify, (req, res) => {
    res.render("Home", { title: "Home Page", user: req.user });
});

app.get('/login', (req, res) => {
    res.render("Auth", { title: "Login", directTo: "/signup", content: "Create new account" });
});

app.get('/signup', (req, res) => {
    res.render("Auth", { title: "SignUp", directTo: "/login", content: "I already have an account" });
});

app.get('/home', (req, res) => {
    res.redirect('/');
});

app.get('/about', verify, (req, res) => {
    res.render("About", { title: "About Page", user: req.user });
});

app.get('/contactUs', verify, (req, res) => {
    res.render("ContactUs", { title: "Contact Us Page", user: req.user });
});

app.post('/login', async (req, res) => {
    console.log('Login body:', req.body);
    const { userEmail, password } = req.body || {};
    if (!userEmail || !password) {
        res.status(400).json({ message: 'Missing credentials' });
        return;
    }
    try {
        const status = await login(userEmail, password);
        if (status === 200) {
            const JWToken = jwt.sign({ email: userEmail }, process.env.secret, { expiresIn: "1h" });
            res.cookie("JWToken", JWToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                maxAge: lifeTime
            });
            console.log('Login token created');
            res.json({ message: "Login Successfully" });
        } else if (status === 401) {
            res.status(401).json({ message: "Invalid User" });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/signup', async (req, res) => {
    console.log('Signup body:', req.body);
    const { userName, userEmail, password } = req.body || {};
    if (!userName || !userEmail || !password) {
        res.status(400).json({ message: 'Missing fields' });
        return;
    }
    try {
        await insertUser(userEmail, userName, password);
        const JWToken = jwt.sign({ email: userEmail }, process.env.secret, { expiresIn: "1h" });
        res.cookie("JWToken", JWToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: lifeTime
        });
        console.log('Signup token created');
        res.status(201).json({ message: 'Signup successful' });
    } catch (err) {
        console.error('Signup error:', err.code, err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Email already exists' });
            return;
        }
        res.status(500).json({ message: 'Signup failed' });
    }
});
app.get('/logout', (req, res) => {
    res.clearCookie("JWToken", {
        httpOnly: true,
        sameSite: 'strict'
    });
    res.redirect('/login');
});

app.post('/', verify, async (req, res) => {
    const { income, countryCode, countryName } = req.body;
    console.log("From post: ", income, countryCode, countryName);
    if (!income || !countryCode || !countryName) {
        res.status(400).json({ message: 'Missing search details' });
        return;
    }
    try {
        const user = await getUserByEmail(req.user.email);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        await saveUserSearch(user.userId, income, countryCode, countryName);
        res.json({ message: 'Search saved' });
    } catch (err) {
        console.error('Save search error:', err);
        res.status(500).json({ message: 'Failed to save search' });
    }
});



app.listen(port, async () => {
    try {
        await initDB();
        console.log(`Server running on http://localhost:${port}`);
    } catch (err) {
        console.error('Startup failed:', err);
        process.exit(1);
    }
});

app.get('/history', verify, async (req, res) => {
    res.render('History')
});


app.post('/history', verify, async (req, res) => {
    try {
        const user = await getUserByEmail(req.user.email);
        const searches = await getUserSearches(user.userId);

        const parsedSearches = searches.map(search => ({
            amount: search.income,
            countryCode: search.countryCode,
            countryName: search.countryName,
            date: new Date(search.createdAt).toLocaleDateString()
        }));
        res.json(parsedSearches);
    } catch (err) {
        console.error('History error:', err);
        res.status(500).render('error', { message: 'Failed to load history' });
    }
});


app.get('/getHistories', verify, async (req, res) => {
    const user = await getUserByEmail(req.user.email);
    const searches = await getUserSearches(user.userId);
    res.json(searches);
});



app.post('/feedback', verify, async (req, res) => {
    try {
        const { feedback } = req.body;

        if (!feedback || feedback.length < 10) {
            return res.status(400).json({ message: 'Feedback must be atleast 10 characters' });
        }
        const user = await getUserByEmail(req.user.email);

        await saveUserFeedback(user.userId, feedback);
        res.json({ message: 'Feedback saved successfully!' });
    } catch (err) {
        console.error('Feedback save error:', err);
        res.status(500).json({ message: 'Server error saving feedback' });
    }
});
