const express = require("express");
const axios = require("axios");
const ejs = require('ejs');
const cheerio = require("cheerio");


const app = express();
const port = 3000;

// Replace these with your actual API keys
const GOOGLE_API_KEY = "AIzaSyCMKX1xH5utZ0TgtovmKSBla01_RlPsX24";
const SCRAPINGBEE_API_KEY = "VZ6JZR0KUWVO8NDML2LDJEHWBUMW6A8WQSD213C90ZJ0VQW681JHPOOG40KN2OY8U3O5P15ZPRDZ36LX";

app.set("view engine", "ejs");

// Set the views directory
app.set("views", __dirname + "/views");

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

function extractPTagsFromHTML(html) {
    const $ = cheerio.load(html);
    const pTags = $("p");
    const pTagTexts = pTags.map((index, element) => $(element).text()).get();
    return pTagTexts;
  }


// Function to get search results from Google Custom Search API
async function googleSearch(query) {
    const url = "https://www.googleapis.com/customsearch/v1";
    const params = {
        key: GOOGLE_API_KEY,
        cx: "e0b026f268cf94096",
        q: query,
        num: 5, // Number of search results to retrieve (max 10 for free version)
    };

    try {
        const response = await axios.get(url, { params });
        // console.log(response.data.items);
        return response.data.items || [];
    } catch (error) {
        console.error("Error fetching search results:", error.message);
        return [];
    }
}

// Function to scrape text from a URL using scrapingbee API
async function scrapeUrl(url) {
    const api_url = "https://app.scrapingbee.com/api/v1/";
    const params = {
        api_key: 'VZ6JZR0KUWVO8NDML2LDJEHWBUMW6A8WQSD213C90ZJ0VQW681JHPOOG40KN2OY8U3O5P15ZPRDZ36LX',
        url,
        render_js: "false", // Disable rendering JavaScript content (for text extraction)
        // return_page_source: 'True',
    };


    try {
        const response = await axios.get(api_url, { params });
        // console.log(response);
        const pTags = await extractPTagsFromHTML(response.data);
        console.log(pTags)
        return pTags|| "";
    } catch (error) {
        console.error("Error scraping URL:", error.message);
        return "";
    }
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/search", async (req, res) => {
    const query = req.body.query;
    if (!query) {
        return res.redirect("/");
    }

    const searchResults = await googleSearch(query);
    const textResults = await Promise.all(searchResults.map(async (item) => {
        const url = item.link;
        const final = await scrapeUrl(url);
        console.log(final);
        return final;
    }));
    // console.log(textResults);
    res.render("results", { query, textResults });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
