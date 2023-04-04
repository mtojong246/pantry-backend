const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    }
})


const app = express();

app.use(express.json({limit: '50mb'}));
app.use(cors());

/* login/register */

app.get('/', (req, res) => {
    db.select('*').from('users').then(data => res.json(data))
})

app.post('/login', (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json('incorrect form submission')
    }
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', req.body.email)
                    .then(user => res.json(user[0]))
                    .catch(err => res.status(400).json('unable to get user'))
            } else {
                res.status(400).json('wrong credentials')
            }
        })
        .catch(err => res.status(400).json('wrong credentials'))
})


app.post('/register', (req, res) => {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
        return res.status(400).json('incorrect form submission')
    } else if (password === confirmPassword) {
        const hash = bcrypt.hashSync(password);
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                trx('users')
                    .insert({
                        email: loginEmail[0].email,
                        groceryitems: '[]',
                        activelist: '[]',
                        pantryrecipes: '[]',
                        pantryitems: '[]',
                        favorites: '[]',
                        recipe: '[]',
                        nutritionvalues: '[{"Total Calories": 0, "Protein":0, "Carbohydrates":0, "Fat":0}]',
                        logvalues: '[{"Total Calories": 0, "Protein":0, "Carbohydrates":0, "Fat":0}]',
                        foodlog: '[{"id": 1, "category":"Breakfast", "items":[]}, {"id": 2,"category":"Lunch", "items":[]}, {"id": 3,"category":"Dinner", "items":[]}, {"id": 4,"category":"Snacks", "items":[]}]',
                        prevquantities: '[]'
                    })
                    .returning('*')
                    .then(user => res.json(user[0]))
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(400).json('error registering user'))
    } else {
        res.status(400).json('error registering user')
    }
})

app.post('/load-user', (req, res) => {
    db.select('*').from('users').where('email', '=', req.body.email).then(data => res.json(data[0])).catch(err => res.status(400).json('error loading user'))
})


/* grocery-list */

app.put('/grocery-list', (req, res) => {
    db('users').where('email','=', req.body.email).update({
        groceryitems: JSON.stringify(req.body.groceryItems)
    }).returning('groceryitems').then(data => res.json(data[0].groceryitems))
})

app.put('/active-list', (req, res) => {
    db('users').where('email', '=', req.body.email).update({
        activelist: JSON.stringify(req.body.activeList)
    }).returning('activelist').then(data => res.json(data[0].activelist))
})

/* pantry */

app.put('/pantry-recipes', (req, res) => {
    db('users').where('email', '=', req.body.email).update({
        pantryrecipes: JSON.stringify(req.body.pantryRecipes)
    }).returning('pantryrecipes').then(data => res.json(data[0].pantryrecipes))
})

app.put('/pantry-items', (req, res) => {
    db('users').where('email', '=', req.body.email).update({
        pantryitems: JSON.stringify(req.body.pantryItems)
    }).returning('pantryitems').then(data => res.json(data[0].pantryitems))
})

app.put('/favorites', (req, res) => {
    db('users').where('email', '=', req.body.email).update({
        favorites: JSON.stringify(req.body.favorites)
    }).returning('favorites').then(data => res.json(data[0].favorites))
})

app.put('/recipe', (req, res) => {
    db('users').where('email', '=', req.body.email).update({
        recipe: JSON.stringify(req.body.recipe)
    }).returning('recipe').then(data => res.json(data[0].recipe))
})


/* nutrition */

app.put('/food-log', (req, res) => {
    db('users').where('email', '=', req.body.email).update({
        foodlog: JSON.stringify(req.body.foodLog)
    }).returning('foodlog').then(data => res.json(data[0].foodlog))
})

app.put('/log-values', (req, res) => {
    db('users').where('email', '=', req.body.email).update({
        logvalues: JSON.stringify(req.body.logValues)
    }).returning('logvalues').then(data => res.json(data[0].logvalues))
})

app.put('/nutrition-values', (req, res) => {
    db('users').where('email', '=', req.body.email).update({
        nutritionvalues: JSON.stringify(req.body.nutritionValues)
    }).returning('nutritionvalues').then(data => res.json(data[0].nutritionvalues))
})

app.put('/prev-quantities', (req, res) => {
    db('users').where('email', '=', req.body.email).update({
        prevquantities: JSON.stringify(req.body.prevQuantities)
    }).returning('prevquantities').then(data => res.json(data[0].prevquantities))
})



app.listen(process.env.PORT || 3080, () => {
    console.log(`app is running on port ${process.env.PORT}`);
})