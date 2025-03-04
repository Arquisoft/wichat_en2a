const axios = require('axios');
const mongoose = require('mongoose');
const Question = require('./question-model'); 

// Define the connection URL
const mongoURI = 'mongodb://localhost:27017/mongo-db-wichat_en2a';

// Connect to MongoDB
mongoose.connect(mongoURI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

async function fetchFlagData(){
    //console.time('fetchFlagData');
    //Currently, this is the only type of question, in the future we will use more.
    //Should consider creating a question-generation.js or something like that to divide responsabilities.
    const query = `
        SELECT ?country ?countryLabel ?flag WHERE {
      ?country wdt:P31 wd:Q6256;  
               wdt:P41 ?flag.     
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 10
    `;

    //Send the query to wikidata 
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try{
        const response = await axios.get(url, {
            headers: {
                //response in json format
                'Accept': 'application/json'
            }
        });

        const results = response.data.results.bindings.map(entry => ({
            type: "flag", 
            imageUrl: entry.flag.value,  
            options: [entry.countryLabel.value],
            correctAnswer: entry.countryLabel.value 
        }));

        //save at db
        saveQuestionsToDB(results);
        console.log("Fetched Flag Data:", results);//testing
        //console.timeEnd('fetchFlagData');
        return results;

    } catch(error){
        throw new Error("Failed to fetch flag data from Wikidata");
    }   
}

async function saveQuestionsToDB(questions){
    try{
        await Question.insertMany(questions) //insert questions to db
        console.log("Questions successfully saved to the DB!");

    }catch(error){
        console.error("Error while saving questions");
    }
}

//Just for testing purposes
fetchFlagData();

module.exports ={
    fetchFlagData
};