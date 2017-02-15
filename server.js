var MongoClient = require('mongodb').MongoClient;
var db_url =  process.env.MLAB_URI;
var request = require("request");
var express = require("express");
var app = express();

//For getting the port number.
app.set('port', (process.env.PORT || 5000))


app.get("/api", function(req, res){
    console.log(req.query.offset);
})

//URL mapping for /api/imagesearch/:query?offset=10
app.get("/api/imagesearch/:query", function(req, res){
    
    //Constant part of API.
	var api = "https://www.googleapis.com/customsearch/v1?imgSize=medium&searchType=image&key=AIzaSyCROKVCgZesSu6wGg5lrsrGGvnxtJfbSKE&cx=002431131552367704307:fgyfwrbhygs&q=";
	//Read the term to be searched.
	var q = req.params.query;
	
	//Read and Set the offset
	var offset=req.query.offset;
	
	if(offset){
	    offset = 10 * (Number(req.query.offset)-1);
	    //console.log(offset);
	}
	else
	    offset=1;
	    
	//Create the URL for google api.
	var url = api+q+"&start="+ offset;
	//console.log(url);
	
	saveToDb(q);
	
	//Get the response JSON
    request({
        url: url,
        json: true
    }, function (error, response, body) {
    
        if (!error && response.statusCode === 200) {
            res.send(JSON.stringify(body.items)) // Print the json response
        }
    })
	
})

//Listen on a given port.
app.listen(app.get('port'), function(){
    console.log('listening on :'+ app.get('port'))
});


function saveToDb(query){
    MongoClient.connect(db_url, function(err, db){
       if(err){
           console.log(err);
           return;
       }
        //console.log("Connected successfully to server");
        
        //Select the collection
        var recentSearchs = db.collection('recent_searches');
        
        //Query the collection for the tuple to be replaced.
        recentSearchs.findAndModify(
            {}, // query
            [['when','asc']],  // sort order
            {$set: { 'term' : query, 'when' : new Date()}},//Replacement
            {},//Options
            function(err, object ){//Callback
                if(err)
                    console.log(err)
                //console.log(object);
            });

        db.close();
    });
}