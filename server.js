const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');
const { futimes } = require('fs');

// Starter Code Setup
const SPREADSHEET_ID = "paste your spreadsheet id"

// Set up authentication
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'privateSetting.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Create a new instance of the Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// Create Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static pages on the base URL, on the root path
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.sendFile('index.html');
});

// Handle GET requests on "/api"
async function onGet(req, res) {
    try {
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A2:B',
        }
        )
        //I define values variable for values in the sheet.
        const values = result.data.values;
        const data = [];//I define a list for push the data.
        values.forEach(element => {
            data.push({
                "name": element[0], 
                "e-mail" : element[1]});
            
        });

        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).send('Google API Server error on GET');
    }

}

app.get('/api', onGet)


// Handle POST requests
async function onPost(req, res) {
    const name = req.body.name;
    const email = req.body.email;
    //I used append method in spreadSheet methods.
    sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A:B",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [[name, email]]
        }
    })
    res.json(`name: ${name}, email: ${email} is added!`);
    
}

app.post('/api', onPost);

// Handle PUT requestsc
async function onPut(req, res) {
    let column = req.params.columnName;
    let updated = req.params.updatedObj;
    let name = req.body.name;
    let email = req.body.email;
    //I responded a attention for empty spaces.
    if(name === undefined || email === undefined){
        res.json("Please fill the blanks correctly!");
    }
    const result = await sheets.spreadsheets.values.get({//I used this code for getting data from spreadSheet in whole codes.
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A2:B'
    });

    const values = result.data.values;
    // I will check 'name' and 'email' case in seperately.
    if(column == "name"){//'name' case.
        for(let i = 0; i<values.length;i++){
            let element = values[i];
            if(element[0] == updated){
                sheets.spreadsheets.values.update({//I am using spreadsheets.values.update method for updating row.
                    spreadsheetId: SPREADSHEET_ID,
                    range: `Sheet1!A${i+2}:B${i+2}`, //This have to be 'i+2'. Because I started the for loop from 0 and our spreadSheets first colums is adjusted for Column Names.
                    valueInputOption: "USER_ENTERED",//These reasons cause it to be 'i+2'. I used 'i+2' in all neccessary places.
                    resource: {
                        values: [[name,email]]
                    }}
                )
                break;
            }
            else{
                continue;
            }}
    }
    else if(column == "email"){//Only difference above code is this is 'email' case.
        for(let i = 0; i<values.length;i++){
            let element = values[i];
            if(element[1] == updated){
                sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `Sheet1!A${i+2}:B${i+2}`,
                    valueInputOption: "USER_ENTERED",
                    resource: {
                        values: [[name,email]]
                    }}
                )
                break;
            }
            else{
                continue;
            }}
            
    }
    
    const response = {
        response:"success"};
    res.json(response);

}

app.put('/api/:columnName/:updatedObj', onPut);

// Handle DELETE requests
async function onDelete(req, res) {
    let column = req.params.columnName;
    let deleted = req.params.deleteObj;
    const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A2:B'
    });
    const values = result.data.values;
    //Almost same with the onPut function but we are using spreadsheets.values.clear method for deleting the row.
    if(column == "name"){//'name' case
        for(let i = 0; i<values.length;i++){
            let element = values[i];
            if(element[0] == deleted){
                const deleteData = await sheets.spreadsheets.values.clear({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `Sheet1!A${i+2}:B${i+2}`
                })
            
                break;
            }
            else{
                continue;
            }}
    }
    else if(column == "email"){//'email' case
        for(let i = 0; i<values.length;i++){
            let element = values[i];
            if(element[1] == deleted){
                const deleteData = await sheets.spreadsheets.values.clear({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `Sheet1!A${i+2}:B${i+2}`
                })
                
                break;
            }
            else{
                continue;
            }}
            
    }

    const response = {
        response:"success"};
    res.json(response);
}

app.delete('/api/:columnName/:deleteObj', onDelete);


async function onPatch(req, res){
    let column = req.params.columnName;
    let patchValue = req.params.value;
    let name = req.body.name;
    let email = req.body.email;
    
    const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A2:B'
    });

    const values = result.data.values;
    //I am checking 'name' and 'email' case same as onPut function.
    if(column == "name"){
        for(let i = 0; i<values.length;i++){
            let element = values[i];
            if(element[0] == patchValue){
                if(name !== undefined && email === undefined){//For patching name.
                    sheets.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_ID,
                        range: `Sheet1!A${i+2}`,//This is 'name' column. Because of that I used A column. The 'i+2' reason is the same as above codes.
                        valueInputOption: "USER_ENTERED",
                        resource: {
                            values: [[name]]
                        }}
                    )
                    break;
                }
                else if(name === undefined && email !== undefined){//For patching email.
                    sheets.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_ID,
                        range: `Sheet1!B${i+2}`,//This is 'email' column. Because of that I used B column.
                        valueInputOption: "USER_ENTERED",
                        resource: {
                            values: [[email]]
                        }}
                    )
                    break;

                }
            }
            else{
                continue;
            }}
    }
    else if(column == "email"){//'email' case
        for(let i = 0; i<values.length;i++){
            let element = values[i];
            if(element[1] == patchValue){
                if(name !== undefined && email === undefined){//Same as above 'name' case 'name' column.
                    sheets.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_ID,
                        range: `Sheet1!A${i+2}`,
                        valueInputOption: "USER_ENTERED",
                        resource: {
                            values: [[name]]
                        }}
                    )
                    break;
                }
                else if(name === undefined && email !== undefined){//Same as above 'name' case 'email' column.
                    sheets.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_ID,
                        range: `Sheet1!B${i+2}`,
                        valueInputOption: "USER_ENTERED",
                        resource: {
                            values: [[email]]
                        }}
                    )
                    break;

                }
            }
            else{
                continue;
            }}
            
    }
    
    const response = {
        response:"success"};
    res.json(response);
    

}

app.patch("/api/:columnName/:value", onPatch);

const port = process.env.PORT || 3000;
const ip = "localhost";
app.listen(port, ip, () => {
    console.log(`Ali Canlier's server is running at http://${ip}:${port}`);
  });



