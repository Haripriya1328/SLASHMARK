const express = require("express");
const mysql = require("mysql");

const app = express();

app.use(express.static("public"));
app.use(express.json());

const con = mysql.createConnection({
	host: "localhost",
	database: "shorturls",
	user: "root",
	password: "",
	multipleStatements: true,
});
con.connect(function(error){
	if(error){
		console.log("Database connection failed");
	}
	else {
        console.log("Database connected successfully");
    }
})

app.get("/",function(request,response){
	response.sendFile(__dirname + "/public/index.html");
});

app.post("/api/create-short-url",function(request,response){
    let longurl = request.body.longurl;
    // Check if the provided long URL already exists in the database
    let sqlCheckExistence = `SELECT * FROM links WHERE longurl='${longurl}' LIMIT 1`;
    con.query(sqlCheckExistence, function(error, result) {
        if (error) {
            response.status(500).json({
                status: "notok",
                message: "Something went wrong"
            });
        } else {
            if (result && result.length > 0) {
                // URL already exists, return the existing short URL and increment count
                response.status(200).json({
                    status: "ok",
                    shorturlid: result[0].shorturlid
                });
                // Increment count for the existing short URL
                let sqlIncrementCount = `UPDATE links SET count=${result[0].count + 1} WHERE id='${result[0].id}'`;
                con.query(sqlIncrementCount, function(error, result) {
                    if (error) {
                        console.log("Error incrementing count:", error);
                    }
                });
            } else {
                // URL doesn't exist, generate a new short URL and insert into the database
                let uniqueID = Math.random().toString(36).replace(/[^a-z0-9]/gi,'').substr(2,10);
                let sqlInsert = `INSERT INTO links(longurl, shorturlid) VALUES('${longurl}','${uniqueID}')`;
                con.query(sqlInsert, function(error, result) {
                    if (error) {
                        response.status(500).json({
                            status:"notok",
                            message:"Something went wrong"
                        });
                    } else {
                        response.status(200).json({
                            status:"ok",
                            shorturlid:uniqueID
                        });
                    }		
                });
            }
        }
    });
});

app.get("/api/get-all-short-urls",function(request,response){
	let sql = `SELECT * FROM links`;
	con.query(sql,function(error,result){
		if(error){
			response.status(500).json({
				status:"notok",
				message:"Something went wrong"
			});
		} else {
			response.status(200).json(result);
		}
	})
});

app.get("/:shorturlid", function(request, response) {
    let shorturlid = request.params.shorturlid;
    let sql = `SELECT * FROM links WHERE shorturlid='${shorturlid}' LIMIT 1`;
    con.query(sql, function(error, result) {
        if (error) {
            response.status(500).json({
                status: "notok",
                message: "Something went wrong"
            });
        } else {
            if (result && result.length > 0) {
                let sql = `UPDATE links SET count=${result[0].count + 1} WHERE id='${result[0].id}' LIMIT 1`;
                con.query(sql, function(error, result2) {
                    if (error) {
                        response.status(500).json({
                            status: "notok",
                            message: "Something went wrong"
                        });
                    } else {
                        response.redirect(result[0].longurl);
                    }
                })
            } else {
                response.status(404).json({
                    status: "notok",
                    message: "Short URL not found"
                });
            }
        }
    })
});


app.listen(5000);
