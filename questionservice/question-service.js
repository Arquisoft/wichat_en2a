const axios = require('axios');
const mongoose = require('mongoose');
const Question = require('./question-model'); 

async function fetchFlagData(){
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

        // This should be use to insert the options. Had problems to connect to the db
        /*
        const results = response.data.results.bindings.map(async entry => {
            const correctAnswer = entry.countryLabel.value;

            // Generate random options for the current question
            const options = await generateRandomOptions(correctAnswer);

            // Create the question object
            return {
                type: "flag", 
                imageUrl: entry.flag.value,  
                options: options, 
                correctAnswer: correctAnswer 
            };
        });

        //wait for filling the options
        const finalResults = await Promise.all(results);*/

        const results = response.data.results.bindings.map(entry => ({
            type: "flag", 
            imageUrl: entry.flag.value,  
            options: [],
            correctAnswer: entry.countryLabel.value 
        }));

        //save at db
        await saveQuestionsToDB(results);
        console.log("Fetched Flag Data:", results);//testing
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
/*
async function generateRandomOptions(correctAnswer){
    try{
        const randomQuestions = await Question.aggregate([
            { $match: { correctAnswer: { $ne: correctAnswer } } }, //we already have the correct one
            { $sample: { size: 3 } }, // ust need 3 
            { $project: { _id: 0, countryLabel: 1 } } // Only return the country label
        ]);

        const randomOptions = randomQuestions.map(question => question.countryLabel);
        randomOptions.push(correctAnswer);
        randomOptions.sort(() => Math.random() - 0.5); // Shuffle the options

        return randomOptions;
    } catch (error) {
        console.error("Error generating random options:", error);
        throw new Error("Failed to generate random options");
    }
}*/


//Just for testing purposes
fetchFlagData();

module.exports ={
    fetchFlagData
};