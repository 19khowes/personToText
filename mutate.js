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

    const items = boardJSON.data.boards[0].items

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