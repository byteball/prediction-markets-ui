const express = require('express');
const path = require('path');
const fs = require("fs");
require('dotenv').config()
const app = express();
const PORT = process.env.PORT || 3005;
const indexPath = path.resolve(__dirname, '..', 'build', 'index.html');

// here we serve the index.html page
app.get(['/', '/currency', '/soccer/*', '/misc', '/create', '/faq', '/market/*'], (req, res, next) => {
    fs.readFile(indexPath, 'utf8', (err, htmlData) => {
        if (err) {
            console.error('Error during file reading', err);
            return res.status(404).end()
        }

        try {
            const url = req.originalUrl || '';
            const address = url.split("/").find((str) => str.length === 32);

            let imageUrl = '';
            let title = null;

            if (url.includes('market') && address) {
                imageUrl = `${process.env.REACT_APP_BACKEND_URL}og_images/market/${address}`;
            } else if (url.includes('faq')) {
                imageUrl = `${process.env.REACT_APP_BACKEND_URL}og_images/faq`
                title = 'Prediction markets — F.A.Q.';
            } else if (url.includes('create')) {
                imageUrl = `${process.env.REACT_APP_BACKEND_URL}og_images/create`
                title = 'Prediction markets — Create new market';
            } else {
                imageUrl = `${process.env.REACT_APP_BACKEND_URL}og_images/main`
            }

            // inject meta tags
            modifiedHTMLData = htmlData.replace('__META_OG_IMAGE__', imageUrl);
            modifiedHTMLData = modifiedHTMLData.replace('__META_OG_IMAGE__', imageUrl);
            
            if (title) {
                modifiedHTMLData = modifiedHTMLData.replace(
                    "<title>Prophet — Decentralized prediction markets</title>",
                    `<title>${title}</title>`
                )
                
                modifiedHTMLData.replace('__META_OG_TITLE__', title);
            }

            return res.send(modifiedHTMLData);
        } catch (e) {
            console.error('error', e)
        }
    });
});

// static resources should just be served as they are
app.use(express.static(
    path.resolve(__dirname, '..', 'build'),
    { maxAge: 0, index: 'index.html' }
));

// listening...
app.listen(PORT, (error) => {
    if (error) {
        return console.log('Error during app startup', error);
    }
    console.log("listening on " + PORT + "...");
});