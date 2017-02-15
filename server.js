var MongoClient = require('mongodb').MongoClient;
var db_url =  process.env.MLAB_URI;
var request = require("request");
var express = require("express");
var app = express();
var res_obj=[];

//For getting the port number.
app.set('port', (process.env.PORT || 5000));

//requied to fetch static pages.
app.use(express.static('.'));

app.get("/", function(req, res) {
    res.send('index.html');
})

app.get("/api/imagesearch", function(req, res){
    getRecentSearch(res);
    //res.send(JSON.stringify(getRecentSearch()));
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
	
	//Save the search in db
	saveToDb(q);
	
	//Get the response JSON
    request({
        url: url,
        json: true
    }, function (error, response, body) {
    
        if (!error && response.statusCode === 200) {
            
            //Reformat the JSON
            body.items.forEach(reformatJSON);
 
            res.send(JSON.stringify(res_obj)) // Print the reformatted json response
        }
    })
	
})

//Listen on a given port.
app.listen(app.get('port'), function(){
    console.log('listening on :'+ app.get('port'))
});


//Function to reformat the JSON
function reformatJSON(item){
     var temp = {
         url : item.link,
         snippet: item.snippet,
         thumbnail : item.image.thumbnailLink,
         context: item.image.contextLink
     }
     res_obj.push(temp);
 }

//Function to save recent searches in db.
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

//Function to return the recent search.
function getRecentSearch(res){
     MongoClient.connect(db_url, function(err, db){
       if(err){
           console.log(err);
           return;
       }
       
       //Select the collection
        var recentSearchs = db.collection('recent_searches');
        
        recentSearchs.find({},{_id: 0, term: 1, when: 1}).sort({when: -1}).toArray(function(err, data){
            if(err) console.log(err);
            res.send(JSON.stringify(data));
        })
       
       db.close();
     });
}