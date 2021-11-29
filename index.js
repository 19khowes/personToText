// 'use strict';
// import {
//     updateBoardNames
// } from './mutate';

const PORT = 3000;
import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
const app = express().use(bodyParser.json());



app.listen(PORT, () => {
    console.log(`listening on port: ${PORT}`);
})

app.get('/', (req, res) => {
    return res.end('hello');
});

app.post("/", (req, res) => {
    let boardID = "no board";
    console.log(req.body.event);
    if (req.body.event) {
        boardID = req.body.event.boardId;
    }
    console.log(`Request from board ${boardID}...`);
    // console.log(JSON.stringify(req.body, 0, 2));

    replaceNamesOfBoard(boardID);

    res.status(200).send(req.body);
})



let options = {
    method: 'post',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjEyNzkxNTIxMSwidWlkIjoyMTA0Mzc0MywiaWFkIjoiMjAyMS0xMC0wOFQxMzo0ODo1Ny43ODRaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6ODE2NTcyMSwicmduIjoidXNlMSJ9.kzW2hSZIHu5k6HrxYjRQdFmUcMdwDL4e2wmvN_Zt_Ys'
    },
    body: JSON.stringify({
        query: undefined
    })
};





async function replaceNamesOfBoard(boardID) {
    const updatedItems = await getBoardItemPeople(boardID);

    // Change each item with updated names (from updatedItems)
    for (let updatedItem of updatedItems) {
        if (updatedItem.personName) {
            mutate(boardID, parseInt(updatedItem.itemID), "text", updatedItem.personName);
        }
    }

    console.log("completed array of updated items: ", updatedItems);
}





async function getBoardItemPeople(boardID) {
    // Will fill this away with new objects 
    let updatedItemArray = [];
    // Set query for board to get
    const boardquery = `query { boards (ids:${boardID}) { name items 
        { id column_values (ids:"person") { id value } }
        } }`;
    // Update options of request to fetch
    options.body = JSON.stringify({
        query: boardquery
    })

    const boardResponse = await fetch("https://api.monday.com/v2", options);
    const boardJSON = await boardResponse.json();
    // console.log(JSON.stringify(boardJSON, null, 2))

    let items;
    if (boardJSON.data) {
        items = boardJSON.data.boards[0].items
    }

    for (let item of items) {
        const idRE = /[0-9]{7,}/;
        const itemID = item.id;
        // console.log(itemID);
        const itemValue = item.column_values[0].value;
        let personID = undefined;
        let personName = undefined;
        // console.log(itemValue);

        if (itemValue) {
            const idmatch = itemValue.match(idRE);
            personID = idmatch[0];
            // console.log(personID);

            // Fetch for the name of people given personid
            const personquery = `query { users (ids:${personID}) { name } }`;
            // Update options of request to fetch
            options.body = JSON.stringify({
                query: personquery
            })
            const personResponse = await fetch("https://api.monday.com/v2", options);
            const personJSON = await personResponse.json();
            personName = personJSON.data.users[0].name;
            // console.log(personName);
        }



        let updatedItem = {
            itemID,
            personID,
            personName
        };
        updatedItemArray.push(updatedItem);
        // console.log(updatedItem);
    }
    // console.log(updatedItemArray);
    return updatedItemArray;
}

async function mutate(boardID, itemID, column, text) {
    const variables = JSON.stringify({
        myBoardId: boardID,
        myItemId: itemID,
        myColumnValues: `{\"${column}\" : \"${text}\"}`
    });
    const query = "mutation ($myBoardId:Int!, $myItemId:Int!, $myColumnValues:JSON!) { change_multiple_column_values(item_id:$myItemId, board_id:$myBoardId, column_values: $myColumnValues) { id } }";

    options.body = JSON.stringify({
        query: query,
        variables: variables
    })
    // console.log(options);

    const response = await fetch("https://api.monday.com/v2", options);
    const json = await response.json();
    // console.log(json);
}